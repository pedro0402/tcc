export type StepKind = "compare" | "mutate" | "traverse" | "done";

export type StructureType = "stack" | "linkedList";

export interface StructureSnapshot {
  nodes: SnapshotNode[];
  highlightedNodeIds?: string[];
}

export interface SnapshotNode {
  id: string;
  value: number;
  next?: string;
}

export interface Step {
  id: string;
  lineHighlighted: number;
  description: string;
  snapshot: StructureSnapshot;
  kind: StepKind;
  callout?: string;
  requiresPrediction?: boolean;
  predictionPrompt?: string;
  predictionAnswer?: string | number | boolean;
  predictionChoices?: Array<string | number | boolean>;
}

export interface PredictionPayload {
  answer: string | number | boolean;
  correct: boolean;
}

export const STACK_SEED = [3, 8, 1];
export const LIST_SEED = [2, 5, 9];
