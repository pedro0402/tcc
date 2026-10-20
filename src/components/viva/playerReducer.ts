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
  /**
   * Modo Exemplo (demonstração comentada): pausa nos passos-chave mostrando um
   * comentário até o aluno continuar. Não envolve resposta nem placar.
   */
  exampleMode: boolean;
  /** Passos onde a demonstração pausa: índice do passo -> comentário. */
  exampleStops: Record<number, string>;
  /** Passo-chave em que a demonstração está parada agora. */
  examplePaused: number | null;
  /** Passos-chave já comentados nesta execução (não pausa de novo). */
  exampleSeen: Record<number, true>;
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
  exampleMode: false,
  exampleStops: {},
  examplePaused: null,
  exampleSeen: {},
  score: { ok: 0, total: 0 },
  finished: false,
};

export type PlayerAction =
  | { type: "START"; op: Op; autoPlay?: boolean; doSteps?: DoStep[]; exampleStops?: Record<number, string> }
  | { type: "CONTINUE_EXAMPLE" }
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
  | { type: "SET_DO_MODE"; on: boolean }
  | { type: "SET_EXAMPLE_MODE"; on: boolean };

/** A pergunta de ponteiro que revela o passo `n`, se houver (modo Fazer). */
export function doStepAt(s: PlayerState, n: number): DoStep | undefined {
  return s.doSteps.find((d) => d.stepIndex === n);
}

/**
 * Com o modo confiança ligado, o aluno precisa declarar o nível antes de ver
 * as opções: a previsão fica "travada" até isso acontecer.
 */
export function needsConfidence(s: PlayerState): boolean {
  // Pergunta já respondida não pede confiança (ligar o modo depois não trava a caixa).
  return (
    s.confidenceMode &&
    s.asking !== null &&
    s.answered[s.asking] === undefined &&
    s.confidence[s.asking] === undefined
  );
}

/**
 * Revela o passo `n`. No modo Exemplo, se `n` é um passo-chave ainda não
 * comentado, para nele mostrando o comentário.
 */
function revealAt(s: PlayerState, n: number, playing: boolean): PlayerState {
  if (s.exampleMode && s.exampleStops[n] !== undefined && !s.exampleSeen[n]) {
    return { ...s, idx: n, examplePaused: n, exampleSeen: { ...s.exampleSeen, [n]: true }, playing: false };
  }
  return { ...s, idx: n, playing };
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
        exampleStops: a.exampleStops ?? {},
        examplePaused: null,
        exampleSeen: {},
        asking: null,
        finished: false,
        playing: a.autoPlay ?? true,
      };

    case "NEXT": {
      if (!s.op || s.asking !== null || s.doAsking !== null || s.examplePaused !== null) return s;
      const n = s.idx + 1;
      if (n >= s.op.steps.length) return { ...s, playing: false };
      // Depois do fim (inclusive após "Pular"), avançar é só revisão: o resultado já
      // foi visto, então nenhuma pergunta reabre nem conta no placar.
      if (!s.finished) {
        // Perguntas vêm antes de revelar o passo; o Fazer tem prioridade.
        if (s.doMode && doStepAt(s, n) && s.doAnswered[n] === undefined) {
          return { ...s, doAsking: n, playing: false };
        }
        if (s.predictMode && s.op.steps[n].predict && s.answered[n] === undefined) {
          return { ...s, asking: n, playing: false };
        }
      }
      return revealAt(s, n, s.playing);
    }

    case "CONTINUE_EXAMPLE":
      if (s.examplePaused === null) return s;
      return { ...s, examplePaused: null, playing: true };

    case "PREV":
      return { ...s, playing: false, asking: null, doAsking: null, examplePaused: null, idx: Math.max(0, s.idx - 1) };

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
      // O passo revelado pode ser também um passo-chave do exemplo.
      return revealAt({ ...s, doAsking: null }, s.doAsking, true);

    case "CONTINUE":
      if (s.asking === null) return s;
      return revealAt({ ...s, asking: null }, s.asking, true);

    case "SKIP":
      if (!s.op) return s;
      return { ...s, asking: null, doAsking: null, examplePaused: null, idx: s.op.steps.length - 1, playing: false };

    case "RESTART":
      // Reinicia a demonstração: os passos-chave voltam a comentar. As respostas
      // são mantidas de propósito: rever a mesma operação não pergunta de novo
      // nem pontua duas vezes (para perguntar de novo, inicia-se a operação outra vez).
      return { ...s, idx: 0, asking: null, doAsking: null, examplePaused: null, exampleSeen: {}, playing: false };

    case "DONE":
      return { ...s, finished: true, playing: false };

    case "SET_PLAYING": {
      if (!a.playing) return { ...s, playing: false };
      // Com uma pergunta ou comentário aberto, quem retoma é o botão "Continuar".
      if (!s.op || s.asking !== null || s.doAsking !== null || s.examplePaused !== null) return s;
      // Play no último passo reproduz de novo desde o começo.
      if (s.idx >= s.op.steps.length - 1) return { ...s, idx: 0, exampleSeen: {}, playing: true };
      return { ...s, playing: true };
    }

    case "SET_SPEED":
      return { ...s, speed: a.speed };

    // Desligar um modo fecha a pergunta/comentário que ele tinha aberto.
    case "SET_PREDICT_MODE":
      return { ...s, predictMode: a.on, asking: a.on ? s.asking : null };

    case "SET_CONFIDENCE_MODE":
      return { ...s, confidenceMode: a.on };

    case "SET_DO_MODE":
      return { ...s, doMode: a.on, doAsking: a.on ? s.doAsking : null };

    case "SET_EXAMPLE_MODE":
      return { ...s, exampleMode: a.on, examplePaused: a.on ? s.examplePaused : null };
  }
}
