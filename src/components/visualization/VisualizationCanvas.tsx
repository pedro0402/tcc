import type { StructureSnapshot, StructureType } from "../../engine/types";
import { StackRenderer } from "./StackRenderer";
import { LinkedListRenderer } from "./LinkedListRenderer";

interface VisualizationCanvasProps {
  snapshot: StructureSnapshot | null;
  structureType: StructureType;
  callout?: string;
}

export function VisualizationCanvas({
  snapshot,
  structureType,
  callout,
}: VisualizationCanvasProps) {
  const empty: StructureSnapshot = { nodes: [] };
  const data = snapshot ?? empty;

  if (structureType === "linkedList") {
    return <LinkedListRenderer snapshot={data} callout={callout} />;
  }

  return <StackRenderer snapshot={data} callout={callout} />;
}
