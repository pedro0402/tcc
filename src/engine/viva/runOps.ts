// Executa uma sequência de operações sobre uma estrutura e devolve o estado
// final, sem gerar passos de visualização. É a base da verificação usada pelo
// estágio Desafio (e, mais tarde, por problemas, jogos e projetos).

import * as E from "./engine";
import type { Node, Structure } from "./engine";
import { listOps } from "./lists";
import type { ListKind } from "./links";
import type { OpId } from "./opIds";

export interface OpSpec {
  op: OpId;
  value?: number;
  pos?: number;
}

export interface RunResult {
  /** Valores do estado final, na ordem de exibição (topo/cabeça primeiro). */
  values: number[];
  /** Operações que terminaram em erro (ex.: posição inválida, underflow). */
  errors: number;
}

function applyStack(nodes: Node[], spec: OpSpec): E.Op {
  switch (spec.op) {
    case "push":
      return E.stackPush(nodes, spec.value ?? 0);
    case "pop":
      return E.stackPop(nodes);
    case "peek":
      return E.stackPeek(nodes);
    case "isEmpty":
      return E.stackIsEmpty(nodes);
    default:
      throw new Error(`operação de pilha desconhecida: ${spec.op}`);
  }
}

function applyList(kind: ListKind, nodes: Node[], spec: OpSpec): E.Op {
  const L = listOps(kind);
  switch (spec.op) {
    case "insertHead":
      return L.insertHead(nodes, spec.value ?? 0);
    case "insertTail":
      return L.insertTail(nodes, spec.value ?? 0);
    case "insertAt":
      return L.insertAt(nodes, spec.pos ?? 0, spec.value ?? 0);
    case "removeAt":
      return L.removeAt(nodes, spec.pos ?? 0);
    case "removeValue":
      return L.removeValue(nodes, spec.value ?? 0);
    case "search":
      return L.search(nodes, spec.value ?? 0);
    default:
      throw new Error(`operação de lista desconhecida: ${spec.op}`);
  }
}

/** Constrói a Op (com passos de visualização) de uma única operação. */
export function opFromSpec(structure: Structure, variant: ListKind, nodes: Node[], spec: OpSpec): E.Op {
  return structure === "stack" ? applyStack(nodes, spec) : applyList(variant, nodes, spec);
}

/**
 * Aplica as operações em ordem. Reaproveita os construtores do motor: cada um
 * devolve o estado final (op.final) e marca erro no último passo quando falha.
 */
export function runOps(
  structure: Structure,
  variant: ListKind,
  initial: number[],
  specs: OpSpec[],
): RunResult {
  let nodes: Node[] = initial.map(E.mk);
  let errors = 0;
  for (const spec of specs) {
    const op = structure === "stack" ? applyStack(nodes, spec) : applyList(variant, nodes, spec);
    if (op.steps[op.steps.length - 1]?.error) errors++;
    nodes = op.final;
  }
  return { values: nodes.map((n) => n.value), errors };
}
