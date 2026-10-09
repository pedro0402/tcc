import { useEffect, useReducer } from "react";
import type { Op, Step } from "../../engine/viva/engine";
import {
  canAnswer,
  initialPlayerState,
  isBusy,
  isCorrectAnswer,
  needsConfidence,
  playerReducer,
  shouldFireDone,
} from "./playerReducer";

import type { ConceptId } from "../../engine/viva/engine";
import type { MisconceptionId } from "../../content/misconceptions";

export interface PredictEvent {
  op: Op;
  /** Índice do passo que a previsão revela. */
  stepIndex: number;
  /** Identificador estável da pergunta, quando houver. */
  predictId?: string;
  concept?: ConceptId;
  chosen: number;
  correct: boolean;
  /** Engano representado pela alternativa escolhida (undefined se acertou). */
  misconception?: MisconceptionId;
  /** Confiança declarada antes de responder (0 chute, 1 acho, 2 certeza). */
  confidence?: 0 | 1 | 2;
}

interface PlayerCallbacks {
  onDone: (op: Op) => void;
  onPredict?: (event: PredictEvent) => void;
}

/** Player do EstruturaViva: reprodução, modo previsão e placar. */
export function usePlayer({ onDone, onPredict }: PlayerCallbacks) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const { op, idx, playing, speed, predictMode, asking, answered, score, confidenceMode, confidence } = state;

  const start = (o: Op, opts: { autoPlay?: boolean } = {}) =>
    dispatch({ type: "START", op: o, autoPlay: opts.autoPlay });

  const next = () => dispatch({ type: "NEXT" });

  const answer = (choice: number) => {
    if (!canAnswer(state) || needsConfidence(state) || !op || asking === null) return;
    dispatch({ type: "ANSWER", choice });
    const predict = op.steps[asking].predict;
    onPredict?.({
      op,
      stepIndex: asking,
      predictId: predict?.id,
      concept: predict?.concept,
      chosen: choice,
      correct: isCorrectAnswer(state, choice),
      misconception: predict?.misconceptions?.[choice],
      confidence: confidence[asking],
    });
  };

  // Relógio da reprodução automática.
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => dispatch({ type: "NEXT" }), speed);
    return () => window.clearTimeout(t);
  }, [playing, speed, idx, asking, op, predictMode, answered]);

  // Avisa o fim da operação uma única vez (o reducer marca `finished`).
  useEffect(() => {
    if (op && shouldFireDone(state)) {
      dispatch({ type: "DONE" });
      onDone(op);
    }
  }, [op, idx, state, onDone]);

  const step: Step | null = op ? op.steps[idx] : null;

  return {
    op,
    idx,
    step,
    playing,
    setPlaying: (v: boolean) => dispatch({ type: "SET_PLAYING", playing: v }),
    speed,
    setSpeed: (v: number) => dispatch({ type: "SET_SPEED", speed: v }),
    predictMode,
    setPredictMode: (on: boolean) => dispatch({ type: "SET_PREDICT_MODE", on }),
    confidenceMode,
    setConfidenceMode: (on: boolean) => dispatch({ type: "SET_CONFIDENCE_MODE", on }),
    confidence,
    setConfidence: (level: 0 | 1 | 2) => dispatch({ type: "SET_CONFIDENCE", level }),
    needsConfidence: needsConfidence(state),
    asking,
    answered,
    answer,
    continueAfter: () => dispatch({ type: "CONTINUE" }),
    score,
    start,
    next,
    skip: () => dispatch({ type: "SKIP" }),
    busy: isBusy(state),
    prev: () => dispatch({ type: "PREV" }),
    restart: () => dispatch({ type: "RESTART" }),
  };
}

export type PlayerApi = ReturnType<typeof usePlayer>;
