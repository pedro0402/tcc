import {
  asStructure,
  eventStore,
  logEvent,
  type EventVariant,
  type LearningEvent,
} from "../learning/events";

// O progresso agora é derivado do log de eventos (src/learning/events.ts).
// As funções record* continuam existindo para quem só quer registrar algo simples.

export interface LocalProgress {
  completedOperations: Array<{
    structure: string;
    operation: string;
    completedAt: string;
  }>;
  quizAttempts: Array<{
    questionId: string;
    isCorrect: boolean;
    answeredAt: string;
  }>;
  predictions: Array<{
    structure: string;
    operation: string;
    isCorrect: boolean;
    answeredAt: string;
  }>;
}

/** Nome da operação como aparece ao usuário: lista dupla/circular ganha o tipo entre parênteses. */
function operationLabel(e: LearningEvent): string {
  const name = e.operation ?? "";
  return e.variant && e.variant !== "simples" ? `${name} (${e.variant})` : name;
}

export function deriveProgress(events: readonly LearningEvent[]): LocalProgress {
  const progress: LocalProgress = { completedOperations: [], quizAttempts: [], predictions: [] };
  for (const e of events) {
    if (e.kind === "operation") {
      progress.completedOperations.push({
        structure: e.structure ?? "",
        operation: operationLabel(e),
        completedAt: e.ts,
      });
    } else if (e.kind === "prediction") {
      progress.predictions.push({
        structure: e.structure ?? "",
        operation: operationLabel(e),
        isCorrect: e.correct === true,
        answeredAt: e.ts,
      });
    } else if (e.kind === "quiz") {
      progress.quizAttempts.push({
        questionId: e.activityId,
        isCorrect: e.correct === true,
        answeredAt: e.ts,
      });
    }
  }
  return progress;
}

export function getLocalProgress(): LocalProgress {
  return deriveProgress(eventStore().getEvents());
}

const activityOf = (structure: string, operation: string, variant?: EventVariant) =>
  `${structure}${variant && variant !== "simples" ? `:${variant}` : ""}:${operation}`;

export function recordOperationComplete(
  structure: string,
  operation: string,
  variant?: EventVariant
): void {
  logEvent({
    approach: "ativa",
    naps: "changing",
    kind: "operation",
    activityId: activityOf(structure, operation, variant),
    structure: asStructure(structure),
    variant,
    operation,
  });
}

export function recordQuizAttempt(
  questionId: string,
  isCorrect: boolean,
  extra: { structure?: string; variant?: EventVariant } = {}
): void {
  logEvent({
    approach: "ativa",
    naps: "responding",
    kind: "quiz",
    activityId: questionId,
    structure: extra.structure ? asStructure(extra.structure) : undefined,
    variant: extra.variant,
    correct: isCorrect,
  });
}

const SELF_EXPLAIN_KEY = "ds-visualizer-self-explanations-v1";

/**
 * Registra uma autoexplicação. O evento (para o progresso e o servidor) guarda
 * apenas que a reflexão aconteceu, com a operação e um sinal de que houve texto.
 * O texto em si fica numa chave local separada e NUNCA é sincronizado, por ser
 * conteúdo livre do aluno.
 */
export function recordSelfExplanation(
  structure: string,
  operation: string,
  text: string,
  variant?: EventVariant
): void {
  const trimmed = text.trim();
  logEvent({
    approach: "ativa",
    naps: "responding",
    kind: "self-explanation",
    activityId: activityOf(structure, operation, variant),
    structure: asStructure(structure),
    variant,
    operation,
    // "correct" não se aplica; usamos a presença do texto só como sinal booleano.
    correct: trimmed.length > 0,
  });
  if (!trimmed) return;
  try {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(SELF_EXPLAIN_KEY);
    const list: Array<{ ts: string; structure: string; operation: string; variant?: string; text: string }> =
      raw ? JSON.parse(raw) : [];
    list.push({ ts: new Date().toISOString(), structure, operation, variant, text: trimmed.slice(0, 500) });
    localStorage.setItem(SELF_EXPLAIN_KEY, JSON.stringify(list.slice(-200)));
  } catch {
    // Sem espaço ou bloqueado: o evento já foi registrado; o texto livre é descartado.
  }
}

export function recordPrediction(
  structure: string,
  operation: string,
  isCorrect: boolean,
  variant?: EventVariant,
  extra: { concept?: string; misconception?: string; confidence?: 0 | 1 | 2 } = {}
): void {
  logEvent({
    approach: "ativa",
    naps: "responding",
    kind: "prediction",
    activityId: activityOf(structure, operation, variant),
    structure: asStructure(structure),
    variant,
    operation,
    correct: isCorrect,
    concept: extra.concept,
    misconception: extra.misconception,
    confidence: extra.confidence,
  });
}
