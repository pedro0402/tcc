// Gera um desafio: a partir do estado atual, aplica uma ou duas operações e
// pede ao aluno que alcance o estado-alvo sozinho, escolhendo as operações.
// O alvo é sempre atingível (foi gerado aplicando operações de verdade) e
// diferente do estado inicial, para não ser trivial.

import type { Structure } from "./engine";
import type { ListKind } from "./links";
import { runOps, type OpSpec } from "./runOps";
import type { OpId } from "./opIds";

export interface Challenge {
  initial: number[];
  target: number[];
  /** Uma solução de referência (existe pelo menos uma). */
  solution: OpSpec[];
  prompt: string;
}

/** Gerador pseudoaleatório simples com semente (determinístico para testes). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Operações usadas nos desafios: só as que mudam o estado de forma previsível. */
function candidateSpecs(structure: Structure, listKind: ListKind, size: number, rnd: () => number): OpSpec[] {
  const val = () => 1 + Math.floor(rnd() * 20);
  if (structure === "stack") {
    const specs: OpSpec[] = [{ op: "push", value: val() }];
    if (size > 0) specs.push({ op: "pop" });
    return specs;
  }
  const specs: OpSpec[] = [
    { op: "insertHead", value: val() },
    { op: "insertTail", value: val() },
  ];
  if (size > 0) {
    specs.push({ op: "removeAt", pos: Math.floor(rnd() * size) });
    specs.push({ op: "insertAt", pos: Math.min(size, 1 + Math.floor(rnd() * size)), value: val() });
  }
  return specs;
}

const describe = (structure: Structure): string =>
  structure === "stack"
    ? "Use push e pop para chegar à pilha-alvo."
    : "Use as inserções e remoções para chegar à lista-alvo.";

/**
 * Gera um desafio resolvível. Tenta algumas vezes até produzir um alvo
 * diferente do estado inicial; se não conseguir, cai num push/insert simples.
 */
export function makeChallenge(
  structure: Structure,
  listKind: ListKind,
  initial: number[],
  seed: number,
): Challenge {
  const rnd = makeRng(seed);
  for (let attempt = 0; attempt < 8; attempt++) {
    const count = 1 + (rnd() < 0.5 ? 0 : 1); // 1 ou 2 operações
    const specs: OpSpec[] = [];
    let size = initial.length;
    for (let k = 0; k < count; k++) {
      const options = candidateSpecs(structure, listKind, size, rnd);
      const spec = options[Math.floor(rnd() * options.length)];
      specs.push(spec);
      // Estima o novo tamanho para a próxima escolha.
      size += spec.op.startsWith("insert") || spec.op === "push" ? 1 : spec.op === "pop" || spec.op.startsWith("remove") ? -1 : 0;
      size = Math.max(0, size);
    }
    const { values, errors } = runOps(structure, listKind, initial, specs);
    if (errors === 0 && JSON.stringify(values) !== JSON.stringify(initial)) {
      return { initial, target: values, solution: specs, prompt: describe(structure) };
    }
  }
  // Fallback garantido: uma inserção simples.
  const fallback: OpSpec = structure === "stack" ? { op: "push", value: 7 } : { op: "insertHead", value: 7 };
  const { values } = runOps(structure, listKind, initial, [fallback]);
  return { initial, target: values, solution: [fallback], prompt: describe(structure) };
}

/** O estado atual já é o alvo? Usado para detectar a conclusão do desafio. */
export function matchesTarget(target: number[], current: number[]): boolean {
  return target.length === current.length && target.every((v, i) => v === current[i]);
}
