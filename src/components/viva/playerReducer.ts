import type { Op } from "../../engine/viva/engine";
import type { DoStep } from "../../engine/viva/doStage";

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
  /** Pedir o nível de confiança antes de revelar as opções. */
  confidenceMode: boolean;
  /** passo -> confiança declarada (0 chute, 1 acho, 2 certeza). */
  confidence: Record<number, 0 | 1 | 2>;
  /**
   * Estágio "Fazer": o aluno aponta o destino dos ponteiros em vez de escolher
   * entre opções. doSteps são as perguntas derivadas da operação atual.
   */
  doMode: boolean;
  doSteps: DoStep[];
  /** Índice do passo cuja pergunta de ponteiro está aberta (ainda não revelado). */
  doAsking: number | null;
  /** passo -> id de nó escolhido (ou null para "null"). */
  doAnswered: Record<number, number | null>;
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
  confidenceMode: false,
  confidence: {},
  doMode: false,
  doSteps: [],
  doAsking: null,
  doAnswered: {},
  score: { ok: 0, total: 0 },
  finished: false,
};

export type PlayerAction =
  | { type: "START"; op: Op; autoPlay?: boolean; doSteps?: DoStep[] }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "ANSWER"; choice: number }
  | { type: "SET_CONFIDENCE"; level: 0 | 1 | 2 }
  | { type: "ANSWER_DO"; nodeId: number | null }
  | { type: "CONTINUE_DO" }
  | { type: "CONTINUE" }
  | { type: "SKIP" }
  | { type: "RESTART" }
  | { type: "DONE" }
  | { type: "SET_PLAYING"; playing: boolean }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_PREDICT_MODE"; on: boolean }
  | { type: "SET_CONFIDENCE_MODE"; on: boolean }
  | { type: "SET_DO_MODE"; on: boolean };

/** A pergunta de ponteiro que revela o passo `n`, se houver (modo Fazer). */
export function doStepAt(s: PlayerState, n: number): DoStep | undefined {
  return s.doSteps.find((d) => d.stepIndex === n);
}

/**
 * Com o modo confiança ligado, o aluno precisa declarar o nível antes de ver
 * as opções: a previsão fica "travada" até isso acontecer.
 */
export function needsConfidence(s: PlayerState): boolean {
  return s.confidenceMode && s.asking !== null && s.confidence[s.asking] === undefined;
}

/** A resposta só vale com uma previsão aberta e ainda sem resposta. */
export function canAnswer(s: PlayerState): boolean {
  return s.asking !== null && !!s.op && s.answered[s.asking] === undefined;
}

export function isCorrectAnswer(s: PlayerState, choice: number): boolean {
  if (s.asking === null || !s.op) return false;
  return s.op.steps[s.asking].predict?.answer === choice;
}

/** Há uma pergunta de ponteiro aberta ainda sem resposta (modo Fazer). */
export function canAnswerDo(s: PlayerState): boolean {
  return s.doAsking !== null && !!s.op && s.doAnswered[s.doAsking] === undefined;
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
        confidence: {},
        doSteps: a.doSteps ?? [],
        doAsking: null,
        doAnswered: {},
        asking: null,
        finished: false,
        playing: a.autoPlay ?? true,
      };

    case "NEXT": {
      if (!s.op || s.asking !== null || s.doAsking !== null) return s;
      const n = s.idx + 1;
      if (n >= s.op.steps.length) return { ...s, playing: false };
      // Modo Fazer tem prioridade: se o próximo passo tem pergunta de ponteiro, abre-a.
      if (s.doMode && doStepAt(s, n) && s.doAnswered[n] === undefined) {
        return { ...s, doAsking: n, playing: false };
      }
      if (s.predictMode && s.op.steps[n].predict && s.answered[n] === undefined) {
        return { ...s, asking: n, playing: false };
      }
      return { ...s, idx: n };
    }

    case "PREV":
      return { ...s, playing: false, asking: null, doAsking: null, idx: Math.max(0, s.idx - 1) };

    case "ANSWER": {
      // Com o modo confiança ligado, não aceita resposta antes do nível.
      if (!canAnswer(s) || needsConfidence(s)) return s;
      const correct = isCorrectAnswer(s, a.choice);
      return {
        ...s,
        answered: { ...s.answered, [s.asking as number]: a.choice },
        score: { ok: s.score.ok + (correct ? 1 : 0), total: s.score.total + 1 },
      };
    }

    case "SET_CONFIDENCE": {
      // Só antes de responder, e sem permitir trocar depois de declarado.
      if (s.asking === null || s.answered[s.asking] !== undefined) return s;
      if (s.confidence[s.asking] !== undefined) return s;
      return { ...s, confidence: { ...s.confidence, [s.asking]: a.level } };
    }

    case "ANSWER_DO": {
      if (!canAnswerDo(s)) return s;
      const step = doStepAt(s, s.doAsking as number);
      const correct = !!step && step.answerId === a.nodeId;
      return {
        ...s,
        doAnswered: { ...s.doAnswered, [s.doAsking as number]: a.nodeId },
        score: { ok: s.score.ok + (correct ? 1 : 0), total: s.score.total + 1 },
      };
    }

    case "CONTINUE_DO":
      if (s.doAsking === null) return s;
      return { ...s, idx: s.doAsking, doAsking: null, playing: true };

    case "CONTINUE":
      if (s.asking === null) return s;
      return { ...s, idx: s.asking, asking: null, playing: true };

    case "SKIP":
      if (!s.op) return s;
      return { ...s, asking: null, doAsking: null, idx: s.op.steps.length - 1, playing: false };

    case "RESTART":
      return { ...s, idx: 0, asking: null, doAsking: null, playing: false };

    case "DONE":
      return { ...s, finished: true, playing: false };

    case "SET_PLAYING":
      return { ...s, playing: a.playing };

    case "SET_SPEED":
      return { ...s, speed: a.speed };

    case "SET_PREDICT_MODE":
      return { ...s, predictMode: a.on };

    case "SET_CONFIDENCE_MODE":
      return { ...s, confidenceMode: a.on };

    case "SET_DO_MODE":
      return { ...s, doMode: a.on };
  }
}
