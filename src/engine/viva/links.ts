// Modelo de ligações das listas encadeadas.
//
// Os nós de um passo ficam em `step.nodes` (a ordem em que são desenhados).
// `Links` diz para onde cada ponteiro de cada nó aponta, por índice nessa lista.
// Isso permite mostrar estados intermediários verdadeiros (por exemplo, um nó
// ligado só num sentido) em vez de pular direto para o resultado.

import type { Node, Predict, Step } from "./engine";

export type ListKind = "simples" | "dupla" | "circular";

export interface Links {
  /** prox[i] = índice do nó para onde nós[i].prox aponta (null = nulo). */
  prox: Array<number | null>;
  /** ant[i] = índice do nó para onde nós[i].ant aponta. Só na lista dupla. */
  ant?: Array<number | null>;
}

/** Ligações completas e consistentes para `n` nós em sequência. */
export function chain(n: number, kind: ListKind): Links {
  const prox = Array.from({ length: n }, (_, i) =>
    i + 1 < n ? i + 1 : kind === "circular" && n > 0 ? 0 : null,
  );
  if (kind !== "dupla") return { prox };
  const ant = Array.from({ length: n }, (_, i) => (i > 0 ? i - 1 : null));
  return { prox, ant };
}

/** Cópia das ligações com alguns ponteiros alterados. */
export function patch(
  base: Links,
  changes: { prox?: Record<number, number | null>; ant?: Record<number, number | null> },
): Links {
  const prox = base.prox.slice();
  for (const [i, t] of Object.entries(changes.prox ?? {})) prox[Number(i)] = t;
  if (!base.ant) return { prox };
  const ant = base.ant.slice();
  for (const [i, t] of Object.entries(changes.ant ?? {})) ant[Number(i)] = t;
  return { prox, ant };
}

/**
 * Abre um espaço para um nó novo, sem ligações, no índice `k`.
 * Os ponteiros que apontavam para índices >= k são deslocados em +1.
 */
export function insertSlot(base: Links, k: number): Links {
  const shift = (t: number | null) => (t === null ? null : t >= k ? t + 1 : t);
  const open = (arr: Array<number | null>) => [
    ...arr.slice(0, k).map(shift),
    null,
    ...arr.slice(k).map(shift),
  ];
  return base.ant ? { prox: open(base.prox), ant: open(base.ant) } : { prox: open(base.prox) };
}

/** As ligações estão exatamente como numa lista bem formada de `n` nós? */
export function linksConsistent(links: Links | undefined, n: number, kind: ListKind): boolean {
  if (!links) return false;
  const want = chain(n, kind);
  const same = (a: Array<number | null> | undefined, b: Array<number | null> | undefined) =>
    (a === undefined && b === undefined) ||
    (!!a && !!b && a.length === b.length && a.every((t, i) => t === b[i]));
  return same(links.prox, want.prox) && same(links.ant, want.ant);
}

interface ListStepInput {
  line: number;
  nodes: Node[];
  links: Links;
  pointers?: Record<string, number | null>;
  highlight?: number[];
  removing?: number;
  message: string;
  vars?: Record<string, string>;
  predict?: Predict;
  error?: boolean;
}

/** Cria um passo de lista com valores padrão para os campos opcionais. */
export function listStep(s: ListStepInput): Step {
  return {
    line: s.line,
    nodes: s.nodes,
    links: s.links,
    pointers: s.pointers ?? {},
    highlight: s.highlight ?? [],
    removing: s.removing,
    message: s.message,
    vars: s.vars ?? {},
    predict: s.predict,
    error: s.error,
  };
}
