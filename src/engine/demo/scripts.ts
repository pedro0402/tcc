import type { DemoFrame, DemoScript } from "./types";

const A = "n3";
const B = "n8";
const NOVO = "n15";

function listNodes() {
  return [
    { id: A, value: 3 },
    { id: B, value: 8 },
    { id: NOVO, value: 15 },
  ];
}

/**
 * Inserção no fim depois que `atual` já está no último nó.
 * Cada frame é o estado da lista + a linha que produz essa mudança.
 */
export function insertTailHomeScript(): DemoScript {
  const nodes = listNodes();
  const frames: DemoFrame[] = [
    {
      id: "idle",
      line: -1,
      nodes: nodes.slice(0, 2),
      order: [A, B],
      pointers: { cabeça: A, atual: B },
      highlight: [],
      holdMs: 1100,
    },
    {
      id: "novo-prox-null",
      line: 0,
      nodes,
      order: [A, B],
      incomingIds: [NOVO],
      pointers: { cabeça: A, atual: B, novo: NOVO },
      highlight: [NOVO],
      connecting: { from: NOVO, to: null },
      holdMs: 1800,
    },
    {
      id: "atual-prox-novo",
      line: 1,
      nodes,
      order: [A, B, NOVO],
      pointers: { cabeça: A, atual: B, novo: NOVO },
      highlight: [NOVO],
      connecting: { from: B, to: NOVO },
      holdMs: 1800,
    },
    {
      id: "return-cabeca",
      line: 2,
      nodes,
      order: [A, B, NOVO],
      pointers: { cabeça: A },
      highlight: [],
      holdMs: 2000,
    },
  ];

  return {
    id: "home-list-insert-tail",
    kind: "linkedList",
    title: "Inserir no fim",
    code: ["novo.proximo = null;", "atual.proximo = novo;", "return cabeca;"],
    frames,
    holdMs: 1600,
  };
}

export const HOME_LIVE_SCRIPT = insertTailHomeScript();
