import type { Op } from "../../engine/viva/engine";

// Estado e transições do player, sem React nem temporizadores.
// O hook usePlayer só liga este reducer ao relógio e aos callbacks.

export interface PlayerState {
  op: Op | null;
  idx: number;
  playing: boolean;
  speed: number;
  predictMode: boolean;
  /** Índice do passo cuja previsão está aberta (o passo ainda não foi revelado). */
  asking: number | null;
  /** passo -> alternativa escolhida */
  answered: Record<number, number>;
  /** Placar da sessão: sobrevive à troca de operação. */
  score: { ok: number; total: number };
  /**
   * Depois que a operação chega ao fim o estado já foi aplicado; voltar passos
   * é só revisão e não deve travar os botões de operação.
   */
  finished: boolean;
}

export const initialPlayerState: PlayerState = {
  op: null,
  idx: 0,
  playing: false,
  speed: 900,
  predictMode: true,
  asking: null,
  answered: {},
  score: { ok: 0, total: 0 },
  finished: false,
};

export type PlayerAction =
  | { type: "START"; op: Op; autoPlay?: boolean }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "ANSWER"; choice: number }
  | { type: "CONTINUE" }
  | { type: "SKIP" }
  | { type: "RESTART" }
  | { type: "DONE" }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_PREDICT_MODE"; on: boolean };

/** A resposta só vale com uma previsão aberta e ainda sem resposta. */
export function canAnswer(s: PlayerState): boolean {
  return s.asking !== null && !!s.op && s.answered[s.asking] === undefined;
}

export function isCorrectAnswer(s: PlayerState, choice: number): boolean {
  if (s.asking === null || !s.op) return false;
  return s.op.steps[s.asking].predict?.answer === choice;
}

/** O fim da operação deve ser notificado uma única vez por execução. */
export function shouldFireDone(s: PlayerState): boolean {
  return !!s.op && s.idx === s.op.steps.length - 1 && !s.finished;
}

/** Ocupado = operação em andamento (ainda não chegou ao fim). */
export function isBusy(s: PlayerState): boolean {
  return !!s.op && !s.finished;
}

export function playerReducer(s: PlayerState, a: PlayerAction): PlayerState {
  switch (a.type) {
    case "START":
      return {
        ...s,
        op: a.op,
        idx: 0,
        answered: {},
        asking: null,
        finished: false,
        playing: a.autoPlay ?? true,
      };

    case "NEXT": {
      if (!s.op || s.asking !== null) return s;
      const n = s.idx + 1;
      if (n >= s.op.steps.length) return { ...s, playing: false };
      if (s.predictMode && s.op.steps[n].predict && s.answered[n] === undefined) {
        return { ...s, asking: n, playing: false };
      }
      return { ...s, idx: n };
    }

    case "PREV":
      return { ...s, playing: false, asking: null, idx: Math.max(0, s.idx - 1) };

    case "ANSWER": {
      if (!canAnswer(s)) return s;
      const correct = isCorrectAnswer(s, a.choice);
      return {
        ...s,
        answered: { ...s.answered, [s.asking as number]: a.choice },
        score: { ok: s.score.ok + (correct ? 1 : 0), total: s.score.total + 1 },
      };
    }

    case "CONTINUE":
      if (s.asking === null) return s;
      return { ...s, idx: s.asking, asking: null, playing: true };

    case "SKIP":
      if (!s.op) return s;
      return { ...s, asking: null, idx: s.op.steps.length - 1, playing: false };

    case "RESTART":
      return { ...s, idx: 0, asking: null, playing: false };

    case "DONE":
      return { ...s, finished: true, playing: false };

    case "SET_PLAYING":
      return { ...s, playing: a.playing };

    case "SET_SPEED":
      return { ...s, speed: a.speed };

    case "SET_PREDICT_MODE":
      return { ...s, predictMode: a.on };
  }
}
