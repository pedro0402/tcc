import { create } from "zustand";
import type { Step, StructureType } from "../engine/types";

export type ExecutionStatus =
  | "idle"
  | "playing"
  | "paused"
  | "awaiting-prediction"
  | "done";

export interface LoadOperationParams {
  steps: Step[];
  structureType: StructureType;
  codeLines: string[];
  activeOperation: string;
  autoPlay?: boolean;
  cursor?: "start" | "end";
  silent?: boolean;
}

interface ExecutionState {
  steps: Step[];
  currentIndex: number;
  status: ExecutionStatus;
  speed: number;
  structureType: StructureType;
  codeLines: string[];
  activeOperation: string | null;
  lastPredictionCorrect: boolean | null;
  silent: boolean;
  loadOperation: (params: LoadOperationParams) => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (ms: number) => void;
  submitPrediction: (answer: unknown) => void;
  reset: () => void;
}

function resolveStatusAfterMove(
  steps: Step[],
  index: number,
  preferPlaying: boolean,
  silent = false
): ExecutionStatus {
  if (index < 0 || steps.length === 0) return "idle";
  if (steps[index]?.requiresPrediction) return "awaiting-prediction";
  if (index === steps.length - 1) return silent ? "paused" : "done";
  return preferPlaying ? "playing" : "paused";
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  steps: [],
  currentIndex: -1,
  status: "idle",
  speed: 900,
  structureType: "stack",
  codeLines: [],
  activeOperation: null,
  lastPredictionCorrect: null,
  silent: false,

  loadOperation: ({
    steps,
    structureType,
    codeLines,
    activeOperation,
    autoPlay,
    cursor = "start",
    silent = false,
  }) => {
    const prepared = silent
      ? steps.map((step) => ({ ...step, requiresPrediction: false }))
      : steps;
    const currentIndex =
      prepared.length === 0
        ? -1
        : cursor === "end"
          ? prepared.length - 1
          : 0;
    set({
      steps: prepared,
      currentIndex,
      structureType,
      codeLines,
      activeOperation,
      lastPredictionCorrect: null,
      silent,
      status: resolveStatusAfterMove(
        prepared,
        currentIndex,
        Boolean(autoPlay),
        silent
      ),
    });
  },

  play: () => {
    const { steps, currentIndex, status } = get();
    if (steps.length === 0) return;
    if (status === "awaiting-prediction") return;
    if (currentIndex >= steps.length - 1) {
      set({ status: "done" });
      return;
    }
    set({ status: "playing" });
  },

  pause: () => {
    const { status } = get();
    if (status === "playing") set({ status: "paused" });
  },

  stepForward: () => {
    const { currentIndex, steps, status } = get();
    if (status === "awaiting-prediction") return;
    if (currentIndex < 0 || currentIndex >= steps.length - 1) return;

    const next = currentIndex + 1;
    set({
      currentIndex: next,
      status: resolveStatusAfterMove(
        steps,
        next,
        status === "playing",
        get().silent
      ),
    });
  },

  stepBackward: () => {
    const { currentIndex, steps } = get();
    if (currentIndex <= 0) return;
    const prev = currentIndex - 1;
    set({
      currentIndex: prev,
      lastPredictionCorrect: null,
      status: resolveStatusAfterMove(steps, prev, false, get().silent),
    });
  },

  setSpeed: (ms) => {
    if (ms > 0) set({ speed: ms });
  },

  submitPrediction: (answer) => {
    const { steps, currentIndex, status } = get();
    if (status !== "awaiting-prediction") return;
    const step = steps[currentIndex];
    if (!step?.requiresPrediction) return;

    const expected = step.predictionAnswer;
    const correct =
      String(answer).trim().toLowerCase() ===
      String(expected).trim().toLowerCase();

    // Clear the gate so the same step can be left behind.
    const unlocked = steps.map((s, i) =>
      i === currentIndex ? { ...s, requiresPrediction: false } : s
    );

    set({
      steps: unlocked,
      lastPredictionCorrect: correct,
      status: currentIndex === unlocked.length - 1 ? "done" : "playing",
    });
  },

  reset: () =>
    set({
      steps: [],
      currentIndex: -1,
      status: "idle",
      codeLines: [],
      activeOperation: null,
      lastPredictionCorrect: null,
      silent: false,
    }),
}));
