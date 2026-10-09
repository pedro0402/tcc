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
