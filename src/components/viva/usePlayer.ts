import { useEffect, useReducer } from "react";
import type { Op, Step } from "../../engine/viva/engine";
import {
  canAnswer,
  initialPlayerState,
  isBusy,
  isCorrectAnswer,
  playerReducer,
  shouldFireDone,
} from "./playerReducer";

export interface PredictEvent {
  op: Op;
  /** Índice do passo que a previsão revela. */
  stepIndex: number;
  chosen: number;
  correct: boolean;
}

interface PlayerCallbacks {
  onDone: (op: Op) => void;
  onPredict?: (event: PredictEvent) => void;
}

/** Player do EstruturaViva: reprodução, modo previsão e placar. */
export function usePlayer({ onDone, onPredict }: PlayerCallbacks) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const { op, idx, playing, speed, predictMode, asking, answered, score } = state;

  const start = (o: Op, opts: { autoPlay?: boolean } = {}) =>
    dispatch({ type: "START", op: o, autoPlay: opts.autoPlay });

  const next = () => dispatch({ type: "NEXT" });

  const answer = (choice: number) => {
    if (!canAnswer(state) || !op || asking === null) return;
    dispatch({ type: "ANSWER", choice });
    onPredict?.({
      op,
      stepIndex: asking,
      chosen: choice,
      correct: isCorrectAnswer(state, choice),
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
