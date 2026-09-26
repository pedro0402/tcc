import { createStep } from "../steps/StepGenerator";
import type { Step, StructureSnapshot } from "../types";

export const LINKED_LIST_INSERT_HEAD_CODE = [
  "function insertAtHead(value) {",
  "  novo = criarNo(value);",
  "  novo.next = head;",
  "  head = novo;",
  "}",
];

export const LINKED_LIST_INSERT_TAIL_CODE = [
  "function insertAtTail(value) {",
  "  novo = criarNo(value);",
  "  if (head == null) { head = novo; return; }",
  "  atual = head;",
  "  while (atual.next != null) atual = atual.next;",
  "  atual.next = novo;",
  "}",
];

export const LINKED_LIST_REMOVE_CODE = [
  "function remove(value) {",
  "  if (head == null) return;",
  "  if (head.value == value) { head = head.next; return; }",
  "  atual = head;",
  "  while (atual.next != null && atual.next.value != value)",
  "    atual = atual.next;",
  "  if (atual.next != null) atual.next = atual.next.next;",
  "}",
];

interface ListNode {
  id: string;
  value: number;
  next: ListNode | null;
}

export class LinkedList {
  private head: ListNode | null = null;
  private nextId = 1;

  constructor(initial: number[] = []) {
    for (const value of initial) this.linkSilentTail(value);
  }

  getValues(): number[] {
    const values: number[] = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }

  replace(values: number[]): void {
    this.head = null;
    this.nextId = 1;
    for (const value of values) this.linkSilentTail(value);
  }

  snapshot(highlightedNodeIds?: string[]): StructureSnapshot {
    return this.toSnapshot(highlightedNodeIds);
  }

  insertAtHead(value: number): Step[] {
    const oldHead = this.head;
    const before = this.toSnapshot(oldHead ? [oldHead.id] : undefined);
    const newNode: ListNode = {
      id: `n${this.nextId++}`,
      value,
      next: this.head,
    };
    this.head = newNode;
    const after = this.toSnapshot([newNode.id]);

    return [
      createStep({
        lineHighlighted: 1,
        description: `InsertHead(${value}): o head é a porta de entrada da lista.`,
        snapshot: before,
        kind: "compare",
        callout: oldHead ? `head atual = ${oldHead.value}` : "head → null",
      }),
      createStep({
        lineHighlighted: 2,
        description: `Criamos um nó novo só com o valor ${value}. Ele ainda não está na lista.`,
        snapshot: before,
        kind: "mutate",
        callout: `criar nó ${value}`,
      }),
      createStep({
        lineHighlighted: 3,
        description: oldHead
          ? `novo.next aponta para ${oldHead.value} (o head antigo). A cadeia não se perde.`
          : "A lista estava vazia: novo.next fica null.",
        snapshot: before,
        kind: "mutate",
        callout: oldHead ? `next → ${oldHead.value}` : "next → null",
        requiresPrediction: true,
        predictionPrompt: "Depois do insertAtHead, quem é o primeiro valor (o novo head)?",
        predictionAnswer: value,
        predictionChoices: [value, oldHead?.value ?? 0, 0],
      }),
      createStep({
        lineHighlighted: 4,
        description: `head agora é ${value}. Entrar no início é O(1): não percorremos a lista.`,
        snapshot: after,
        kind: "done",
        callout: `novo head = ${value}`,
      }),
    ];
  }

  insertAtTail(value: number): Step[] {
    const before = this.toSnapshot();

    if (!this.head) {
      const newNode: ListNode = {
        id: `n${this.nextId++}`,
        value,
        next: null,
      };
      this.head = newNode;
      return [
        createStep({
          lineHighlighted: 1,
          description: `InsertTail(${value}): não há nós, então o fim e o início são o mesmo lugar.`,
          snapshot: before,
          kind: "compare",
          callout: "lista vazia",
        }),
        createStep({
          lineHighlighted: 3,
          description: `head recebe ${value}. Ele é head e tail ao mesmo tempo.`,
          snapshot: this.toSnapshot([newNode.id]),
          kind: "done",
          callout: `head = tail = ${value}`,
        }),
      ];
    }

    const steps: Step[] = [
      createStep({
        lineHighlighted: 1,
        description: `InsertTail(${value}): para achar o fim, começamos no head e andamos pelos next.`,
        snapshot: this.toSnapshot([this.head.id]),
        kind: "compare",
        callout: `começar no head (${this.head.value})`,
      }),
      createStep({
        lineHighlighted: 2,
        description: `Nó ${value} criado. Ainda vamos ligá-lo no último next.`,
        snapshot: before,
        kind: "mutate",
        callout: `criar nó ${value}`,
      }),
    ];

    let current = this.head;
    while (current.next) {
      current = current.next;
      steps.push(
        createStep({
          lineHighlighted: 5,
          description: `Ainda não é o fim: ${current.value} tem next. Continuamos. Por isso insertTail é O(n).`,
          snapshot: this.toSnapshot([current.id]),
          kind: "traverse",
          callout: `atual = ${current.value}`,
        })
      );
    }

    const newNode: ListNode = {
      id: `n${this.nextId++}`,
      value,
      next: null,
    };
    current.next = newNode;

    steps.push(
      createStep({
        lineHighlighted: 6,
        description: `${current.value}.next agora aponta para ${value}.`,
        snapshot: this.toSnapshot([newNode.id, current.id]),
        kind: "mutate",
        callout: `${current.value} → ${value}`,
        requiresPrediction: true,
        predictionPrompt: "Qual valor fica no fim da lista depois do insertAtTail?",
        predictionAnswer: value,
        predictionChoices: [value, this.head.value, current.value],
      }),
      createStep({
        lineHighlighted: 6,
        description: `${value} é o novo tail. O head continua ${this.head.value}.`,
        snapshot: this.toSnapshot([newNode.id]),
        kind: "done",
        callout: `novo tail = ${value}`,
      })
    );

    return steps;
  }

  remove(value: number): Step[] {
    const before = this.toSnapshot();

    if (!this.head) {
      return [
        createStep({
          lineHighlighted: 2,
          description: "Lista vazia — não há nó para remover.",
          snapshot: before,
          kind: "compare",
          callout: "nada a remover",
        }),
      ];
    }

    if (this.head.value === value) {
      const old = this.head.value;
      const nextVal = this.head.next?.value;
      this.head = this.head.next;
      return [
        createStep({
          lineHighlighted: 1,
          description: `Remove(${value}): o valor está logo no head.`,
          snapshot: before,
          kind: "compare",
          callout: `head = ${old}`,
        }),
        createStep({
          lineHighlighted: 3,
          description:
            nextVal === undefined
              ? `head anda para null. A lista fica vazia.`
              : `head anda para o next (${nextVal}). O nó ${old} some da cadeia.`,
          snapshot: this.toSnapshot(this.head ? [this.head.id] : undefined),
          kind: "mutate",
          callout: nextVal === undefined ? "head → null" : `novo head = ${nextVal}`,
          requiresPrediction: true,
          predictionPrompt: `O ${value} era o head. Qual é o novo head? (null se a lista esvaziar)`,
          predictionAnswer: nextVal ?? "null",
          predictionChoices: [nextVal ?? "null", old, 0],
        }),
        createStep({
          lineHighlighted: 3,
          description: `Remoção no head é O(1): só mudamos um ponteiro.`,
          snapshot: this.toSnapshot(),
          kind: "done",
          callout: nextVal === undefined ? "lista vazia" : `head = ${nextVal}`,
        }),
      ];
    }

    const steps: Step[] = [
      createStep({
        lineHighlighted: 1,
        description: `Remove(${value}): não está no head. Percorremos até achar o nó cujo next é ${value}.`,
        snapshot: this.toSnapshot([this.head.id]),
        kind: "compare",
        callout: `head = ${this.head.value}`,
      }),
    ];

    let current = this.head;
    while (current.next && current.next.value !== value) {
      current = current.next;
      steps.push(
        createStep({
          lineHighlighted: 5,
          description: `${current.value} não aponta para ${value}. Seguimos o next.`,
          snapshot: this.toSnapshot([current.id]),
          kind: "traverse",
          callout: `olhando ${current.value}`,
        })
      );
    }

    if (!current.next) {
      steps.push(
        createStep({
          lineHighlighted: 6,
          description: `${value} não está na lista. Nada muda.`,
          snapshot: this.toSnapshot(),
          kind: "done",
          callout: "não encontrado",
        })
      );
      return steps;
    }

    const removed = current.next;
    const afterVal = removed.next?.value;
    current.next = removed.next;

    steps.push(
      createStep({
        lineHighlighted: 7,
        description:
          afterVal === undefined
            ? `${current.value}.next pula ${value} e vai para null.`
            : `${current.value}.next pula ${value} e liga em ${afterVal}.`,
        snapshot: this.toSnapshot([current.id]),
        kind: "mutate",
        callout:
          afterVal === undefined
            ? `${current.value} → null`
            : `${current.value} → ${afterVal}`,
        requiresPrediction: true,
        predictionPrompt: `Depois de remover ${value}, para onde aponta o nó ${current.value}?`,
        predictionAnswer: afterVal ?? "null",
        predictionChoices: [afterVal ?? "null", value, current.value],
      }),
      createStep({
        lineHighlighted: 7,
        description: `O nó ${value} ficou isolado. A lista permanece ligada.`,
        snapshot: this.toSnapshot(),
        kind: "done",
        callout: `${value} removido`,
      })
    );

    return steps;
  }

  private linkSilentTail(value: number): void {
    const node: ListNode = {
      id: `n${this.nextId++}`,
      value,
      next: null,
    };
    if (!this.head) {
      this.head = node;
      return;
    }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = node;
  }

  private toSnapshot(highlightedNodeIds?: string[]): StructureSnapshot {
    const nodes: StructureSnapshot["nodes"] = [];
    let current = this.head;
    while (current) {
      nodes.push({
        id: current.id,
        value: current.value,
        next: current.next ? current.next.id : undefined,
      });
      current = current.next;
    }
    return { nodes, highlightedNodeIds };
  }
}
