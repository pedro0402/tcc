import { useEffect, useReducer } from "react";
import type { Op, Step } from "../../engine/viva/engine";
import {
  canAnswer,
  canAnswerDo,
  doStepAt,
  initialPlayerState,
  isBusy,
  isCorrectAnswer,
  needsConfidence,
  playerReducer,
  shouldFireDone,
} from "./playerReducer";

import type { ConceptId } from "../../engine/viva/engine";
import type { MisconceptionId } from "../../content/misconceptions";
import { deriveDoSteps, type DoStep } from "../../engine/viva/doStage";

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

export interface DoEvent {
  op: Op;
  stepIndex: number;
  pointer: string;
  correct: boolean;
}

interface PlayerCallbacks {
  onDone: (op: Op) => void;
  onPredict?: (event: PredictEvent) => void;
  onDo?: (event: DoEvent) => void;
}

/** Player do EstruturaViva: reprodução, modo previsão e placar. */
export function usePlayer({ onDone, onPredict, onDo }: PlayerCallbacks) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const { op, idx, playing, speed, predictMode, asking, answered, score, confidenceMode, confidence, doMode, doAsking, doAnswered, exampleMode, examplePaused, exampleStops } = state;

  const start = (o: Op, opts: { autoPlay?: boolean; exampleStops?: Record<number, string> } = {}) =>
    // As perguntas do estágio Fazer são derivadas da operação no momento de iniciar.
    dispatch({ type: "START", op: o, autoPlay: opts.autoPlay, doSteps: deriveDoSteps(o), exampleStops: opts.exampleStops });

  const next = () => dispatch({ type: "NEXT" });

  const answerDo = (nodeId: number | null) => {
    if (!canAnswerDo(state) || !op || doAsking === null) return;
    const step = doStepAt(state, doAsking);
    dispatch({ type: "ANSWER_DO", nodeId });
    if (step) onDo?.({ op, stepIndex: doAsking, pointer: step.pointer, correct: step.answerId === nodeId });
  };

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
  }, [playing, speed, idx, asking, doAsking, examplePaused, op, predictMode, doMode, exampleMode, answered, doAnswered]);

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
    doMode,
    setDoMode: (on: boolean) => dispatch({ type: "SET_DO_MODE", on }),
    exampleMode,
    setExampleMode: (on: boolean) => dispatch({ type: "SET_EXAMPLE_MODE", on }),
    examplePaused,
    exampleNote: examplePaused !== null ? exampleStops[examplePaused] : undefined,
    continueExample: () => dispatch({ type: "CONTINUE_EXAMPLE" }),
    doAsking,
    doAnswered,
    doStep: doAsking !== null ? doStepAt(state, doAsking) : undefined,
    answerDo,
    continueAfterDo: () => dispatch({ type: "CONTINUE_DO" }),
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
