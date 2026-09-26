import { createStep } from "../steps/StepGenerator";
import type { Step, StructureSnapshot } from "../types";

export const STACK_CODE = [
  "function push(value) {",
  "  checarEspaco();",
  "  topo = topo + 1;",
  "  pilha[topo] = value;",
  "}",
];

export const STACK_POP_CODE = [
  "function pop() {",
  "  checarSeVazia();",
  "  valor = pilha[topo];",
  "  topo = topo - 1;",
  "  return valor;",
  "}",
];

export class Stack {
  private items: number[] = [];

  constructor(initial: number[] = []) {
    this.items = [...initial];
  }

  getValues(): number[] {
    return [...this.items];
  }

  replace(values: number[]): void {
    this.items = [...values];
  }

  snapshot(highlightedNodeIds?: string[]): StructureSnapshot {
    return this.toSnapshot(this.items, highlightedNodeIds);
  }

  push(value: number): Step[] {
    const before = this.toSnapshot(this.items);
    const oldTop = this.items[this.items.length - 1];
    const afterValues = [...this.items, value];
    this.items = afterValues;
    const topId = String(afterValues.length - 1);
    const after = this.toSnapshot(afterValues, [topId]);

    return [
      createStep({
        lineHighlighted: 1,
        description: `Push(${value}): só o topo muda. O resto da pilha fica parado.`,
        snapshot: before,
        kind: "compare",
        callout: oldTop === undefined ? "pilha vazia" : `topo atual = ${oldTop}`,
      }),
      createStep({
        lineHighlighted: 2,
        description: "Conferimos se há espaço. Nesta visualização a pilha não tem limite.",
        snapshot: before,
        kind: "compare",
        callout: "ok para inserir",
      }),
      createStep({
        lineHighlighted: 3,
        description: "topo = topo + 1: abrimos uma posição nova acima de todos.",
        snapshot: before,
        kind: "mutate",
        callout: "topo++",
        requiresPrediction: true,
        predictionPrompt: `Depois do push, qual valor fica no topo?`,
        predictionAnswer: value,
        predictionChoices: [value, oldTop ?? 0, value + 1],
      }),
      createStep({
        lineHighlighted: 4,
        description: `${value} entra no topo. LIFO: ele será o primeiro a sair num pop.`,
        snapshot: after,
        kind: "done",
        callout: `novo topo = ${value}`,
      }),
    ];
  }

  pop(): Step[] {
    const beforeValues = [...this.items];
    const before = this.toSnapshot(beforeValues);
    const removed = beforeValues[beforeValues.length - 1];

    if (removed === undefined) {
      return [
        createStep({
          lineHighlighted: 2,
          description: "Pilha vazia — underflow: não existe topo para remover.",
          snapshot: before,
          kind: "compare",
          callout: "underflow",
        }),
      ];
    }

    const below = beforeValues[beforeValues.length - 2];
    const afterValues = beforeValues.slice(0, -1);
    this.items = afterValues;
    const after = this.toSnapshot(afterValues);

    return [
      createStep({
        lineHighlighted: 1,
        description: "Pop(): o candidato a sair é sempre o topo — nunca o fundo.",
        snapshot: this.toSnapshot(beforeValues, [String(beforeValues.length - 1)]),
        kind: "compare",
        callout: `vamos tirar ${removed}`,
      }),
      createStep({
        lineHighlighted: 2,
        description: "A pilha não está vazia, então o pop é válido.",
        snapshot: this.toSnapshot(beforeValues, [String(beforeValues.length - 1)]),
        kind: "compare",
        callout: "não é underflow",
      }),
      createStep({
        lineHighlighted: 3,
        description: `Lemos ${removed} no topo, mas ele ainda está na pilha.`,
        snapshot: this.toSnapshot(beforeValues, [String(beforeValues.length - 1)]),
        kind: "mutate",
        callout: `lendo ${removed}`,
        requiresPrediction: true,
        predictionPrompt: "Qual valor o pop remove (o que sai)?",
        predictionAnswer: removed,
        predictionChoices: [removed, below ?? 0, 0],
      }),
      createStep({
        lineHighlighted: 4,
        description:
          below === undefined
            ? `${removed} saiu. A pilha ficou vazia.`
            : `${removed} saiu. O novo topo é ${below}.`,
        snapshot: after,
        kind: "done",
        callout:
          below === undefined ? `${removed} saiu` : `novo topo = ${below}`,
      }),
    ];
  }

  private toSnapshot(
    values: number[],
    highlightedNodeIds?: string[]
  ): StructureSnapshot {
    return {
      nodes: values.map((value, i) => ({ id: String(i), value })),
      highlightedNodeIds,
    };
  }
}
