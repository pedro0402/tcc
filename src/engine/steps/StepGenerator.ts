import type { Step, StepKind, StructureSnapshot } from "../types";

let stepCounter = 0;

export function resetStepIds(): void {
  stepCounter = 0;
}

export function cloneSnapshot(snapshot: StructureSnapshot): StructureSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({ ...node })),
    highlightedNodeIds: snapshot.highlightedNodeIds
      ? [...snapshot.highlightedNodeIds]
      : undefined,
  };
}

export function createStep(params: {
  lineHighlighted: number;
  description: string;
  snapshot: StructureSnapshot;
  kind: StepKind;
  callout?: string;
  requiresPrediction?: boolean;
  predictionPrompt?: string;
  predictionAnswer?: string | number | boolean;
  predictionChoices?: Array<string | number | boolean>;
}): Step {
  stepCounter += 1;
  return {
    id: `step-${stepCounter}`,
    lineHighlighted: params.lineHighlighted,
    description: params.description,
    kind: params.kind,
    snapshot: cloneSnapshot(params.snapshot),
    callout: params.callout,
    requiresPrediction: params.requiresPrediction,
    predictionPrompt: params.predictionPrompt,
    predictionAnswer: params.predictionAnswer,
    predictionChoices: params.predictionChoices,
  };
}
