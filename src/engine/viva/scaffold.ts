// Escada de scaffolding: o apoio diminui conforme o aluno demonstra domínio.
//
// Observar  — demonstração completa, sem perguntas.
// Prever    — pausa nos passos-chave e pergunta o próximo estado (previsão).
// Fazer     — o aluno executa os passos (clica no destino de cada ponteiro).
// Desafio   — recebe só a meta final; nenhuma pergunta durante a execução.
//
// A regra de progressão é explicável e simétrica: dois acertos seguidos sem
// dica sobem um degrau; dois erros seguidos descem um. A escolha manual do
// estágio é sempre permitida (preserva a autonomia do aluno).

export const STAGES = ["observar", "prever", "fazer", "desafio"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  observar: "Observar",
  prever: "Prever",
  fazer: "Fazer",
  desafio: "Desafio",
};

export const STAGE_HINT: Record<Stage, string> = {
  observar: "Veja a operação com comentários nos passos-chave, sem perguntas.",
  prever: "Antes dos passos-chave, preveja o que vem a seguir.",
  fazer: "Agora é você: aponte para onde cada ponteiro vai.",
  desafio: "Só a meta é dada. Resolva sem dicas passo a passo.",
};

export const STREAK_TO_ADVANCE = 2;
export const STREAK_TO_DROP = 2;

export interface ScaffoldState {
  stage: Stage;
  /** Acertos seguidos sem usar dica (zera ao errar ou usar dica). */
  cleanStreak: number;
  /** Erros seguidos (zera ao acertar). */
  errorStreak: number;
}

export const initialScaffold: ScaffoldState = {
  stage: "observar",
  cleanStreak: 0,
  errorStreak: 0,
};

function stageIndex(s: Stage): number {
  return STAGES.indexOf(s);
}

function stageAt(i: number): Stage {
  return STAGES[Math.max(0, Math.min(STAGES.length - 1, i))];
}

/** Degrau imediatamente acima, se houver. */
export function nextStage(s: Stage): Stage | null {
  const i = stageIndex(s);
  return i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

/** Quantos acertos limpos ainda faltam para subir (0 = já pode, ou não há acima). */
export function remainingToAdvance(s: ScaffoldState): number {
  if (!nextStage(s.stage)) return 0;
  return Math.max(0, STREAK_TO_ADVANCE - s.cleanStreak);
}

/** Resultado de uma tentativa que conta para a progressão. */
export interface Attempt {
  correct: boolean;
  /** Usou alguma dica? Um acerto com dica não conta para subir. */
  hintUsed?: boolean;
}

/**
 * Aplica uma tentativa e devolve o novo estado, subindo ou descendo um degrau
 * quando a sequência atinge o limite. Nunca passa dos extremos.
 */
export function applyAttempt(state: ScaffoldState, attempt: Attempt): ScaffoldState {
  if (attempt.correct) {
    const clean = attempt.hintUsed ? 0 : state.cleanStreak + 1;
    if (!attempt.hintUsed && clean >= STREAK_TO_ADVANCE && nextStage(state.stage)) {
      return { stage: stageAt(stageIndex(state.stage) + 1), cleanStreak: 0, errorStreak: 0 };
    }
    return { ...state, cleanStreak: clean, errorStreak: 0 };
  }
  // Errou.
  const errors = state.errorStreak + 1;
  if (errors >= STREAK_TO_DROP && stageIndex(state.stage) > 0) {
    return { stage: stageAt(stageIndex(state.stage) - 1), cleanStreak: 0, errorStreak: 0 };
  }
  return { ...state, cleanStreak: 0, errorStreak: errors };
}

/** Troca manual de estágio: zera as sequências, pois o contexto mudou. */
export function setStage(_state: ScaffoldState, stage: Stage): ScaffoldState {
  return { stage, cleanStreak: 0, errorStreak: 0 };
}
