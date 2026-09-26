import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "./executionStore";
import type { Step } from "../engine/types";

function makeSteps(partial: Partial<Step>[] = []): Step[] {
  const base: Step[] = [
    {
      id: "1",
      lineHighlighted: 1,
      description: "a",
      kind: "compare",
      snapshot: { nodes: [] },
    },
    {
      id: "2",
      lineHighlighted: 2,
      description: "b",
      kind: "mutate",
      snapshot: { nodes: [] },
      requiresPrediction: true,
      predictionAnswer: 5,
      predictionPrompt: "topo?",
    },
    {
      id: "3",
      lineHighlighted: 3,
      description: "c",
      kind: "done",
      snapshot: { nodes: [{ id: "0", value: 5 }] },
    },
  ];
  return partial.length
    ? partial.map((p, i) => ({ ...base[i % base.length], ...p, id: String(i) }))
    : base;
}

describe("executionStore", () => {
  beforeEach(() => {
    useExecutionStore.getState().reset();
  });

  it("não avança além do último passo", () => {
    const steps = makeSteps();
    useExecutionStore.getState().loadOperation({
      steps,
      structureType: "stack",
      codeLines: ["x"],
      activeOperation: "push",
    });

    const store = useExecutionStore.getState();
    store.stepForward();
    expect(useExecutionStore.getState().status).toBe("awaiting-prediction");
    store.stepForward();
    expect(useExecutionStore.getState().currentIndex).toBe(1);
  });

  it("submitPrediction libera o avanço", () => {
    const steps = makeSteps();
    useExecutionStore.getState().loadOperation({
      steps,
      structureType: "stack",
      codeLines: ["x"],
      activeOperation: "push",
    });
    useExecutionStore.getState().stepForward();
    useExecutionStore.getState().submitPrediction(5);

    const state = useExecutionStore.getState();
    expect(state.lastPredictionCorrect).toBe(true);
    expect(state.status).not.toBe("awaiting-prediction");
    state.stepForward();
    expect(useExecutionStore.getState().currentIndex).toBe(2);
    expect(useExecutionStore.getState().status).toBe("done");
  });

  it("stepBackward não vai abaixo de 0", () => {
    useExecutionStore.getState().loadOperation({
      steps: makeSteps(),
      structureType: "stack",
      codeLines: ["x"],
      activeOperation: "push",
    });
    useExecutionStore.getState().stepBackward();
    expect(useExecutionStore.getState().currentIndex).toBe(0);
  });
});
