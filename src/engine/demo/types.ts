export type DemoStructureKind =
  | "linkedList"
  | "stack"
  | "queue"
  | "tree"
  | "hash";

export type DemoNode = {
  id: string;
  value: number | string;
};

export type DemoEdge = {
  from: string;
  to: string | null;
};

/**
 * Snapshot de um passo da demonstração. A visualização e o destaque do
 * código leem o mesmo frame — não há animação paralela.
 */
export type DemoFrame = {
  id: string;
  /** Índice da linha em `code`, ou -1 se nenhuma. */
  line: number;
  nodes: DemoNode[];
  /** Ordem estrutural (cadeia da lista, topo→base da pilha, etc.). */
  order: string[];
  pointers: Record<string, string | null>;
  highlight: string[];
  /** Nós visíveis ainda fora da estrutura (ex.: `novo` recém-criado). */
  incomingIds?: string[];
  /** Aresta sendo ligada neste passo. */
  connecting?: DemoEdge;
  removingIds?: string[];
  holdMs?: number;
};

export type DemoScript = {
  id: string;
  kind: DemoStructureKind;
  title: string;
  code: string[];
  frames: DemoFrame[];
  holdMs: number;
};

export function nodeMap(frame: DemoFrame): Map<string, DemoNode> {
  return new Map(frame.nodes.map((n) => [n.id, n]));
}

export function pointersOn(frame: DemoFrame, nodeId: string): string[] {
  return Object.entries(frame.pointers)
    .filter(([, id]) => id === nodeId)
    .map(([name]) => name);
}
