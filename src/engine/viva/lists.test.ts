import { describe, expect, it } from "vitest";
import * as E from "./engine";
import type { Node, Op } from "./engine";
import { chain, linksConsistent, type ListKind } from "./links";
import { listOps } from "./lists";

const vals = (nodes: Node[]) => nodes.map((n) => n.value);
const mkList = (...v: number[]) => v.map(E.mk);
const lastOf = <T>(a: T[]): T => a[a.length - 1];

// Gerador pseudoaleatório com semente fixa: os testes são reproduzíveis.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Modelo de referência: o que cada operação deveria produzir num array comum. */
type Spec =
  | { op: "insertHead"; v: number }
  | { op: "insertTail"; v: number }
  | { op: "insertAt"; pos: number; v: number }
  | { op: "removeAt"; pos: number }
  | { op: "removeValue"; v: number }
  | { op: "search"; v: number };

function model(a: number[], s: Spec): { out: number[]; error: boolean } {
  switch (s.op) {
    case "insertHead":
      return { out: [s.v, ...a], error: false };
    case "insertTail":
      return { out: [...a, s.v], error: false };
    case "insertAt":
      if (!Number.isInteger(s.pos) || s.pos < 0 || s.pos > a.length) return { out: a, error: true };
      return { out: [...a.slice(0, s.pos), s.v, ...a.slice(s.pos)], error: false };
    case "removeAt":
      if (!Number.isInteger(s.pos) || s.pos < 0 || s.pos >= a.length) return { out: a, error: true };
      return { out: a.filter((_, i) => i !== s.pos), error: false };
    case "removeValue": {
      const i = a.indexOf(s.v);
      return i < 0 ? { out: a, error: true } : { out: a.filter((_, k) => k !== i), error: false };
    }
    case "search":
      return { out: a, error: !a.includes(s.v) };
  }
}

function run(kind: ListKind, list: Node[], s: Spec): Op {
  const L = listOps(kind);
  switch (s.op) {
    case "insertHead":
      return L.insertHead(list, s.v);
    case "insertTail":
      return L.insertTail(list, s.v);
    case "insertAt":
      return L.insertAt(list, s.pos, s.v);
    case "removeAt":
      return L.removeAt(list, s.pos);
    case "removeValue":
      return L.removeValue(list, s.v);
    case "search":
      return L.search(list, s.v);
  }
}

/** Regras que todo passo de lista com `links` precisa cumprir. */
function assertWellFormed(op: Op, kind: ListKind) {
  expect(op.steps.length).toBeGreaterThan(0);
  expect(op.variant).toBe(kind);
  op.steps.forEach((st, i) => {
    expect(st.line).toBeLessThan(op.code.length);
    if (st.predict) {
      expect(i).toBeGreaterThan(0);
      expect(st.predict.options[st.predict.answer]).toBeDefined();
    }
    if (kind === "simples") return;
    const n = st.nodes.length;
    expect(st.links, `passo ${i} sem links`).toBeDefined();
    expect(st.links!.prox).toHaveLength(n);
    if (kind === "dupla") expect(st.links!.ant).toHaveLength(n);
    else expect(st.links!.ant).toBeUndefined();
    for (const t of [...st.links!.prox, ...(st.links!.ant ?? [])]) {
      if (t !== null) {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(n);
      }
    }
    for (const p of Object.values(st.pointers)) {
      if (p !== null) expect(p).toBeLessThan(Math.max(n, 1));
    }
  });
}

const KINDS: ListKind[] = ["simples", "dupla", "circular"];

describe.each(KINDS)("lista %s", (kind) => {
  it("operações batem com o modelo em sequências pseudoaleatórias", () => {
    const rand = rng(kind.length * 7919);
    const int = (max: number) => Math.floor(rand() * max);
    for (let round = 0; round < 40; round++) {
      let list = mkList(...Array.from({ length: int(5) }, () => int(20)));
      let ref = vals(list);
      for (let k = 0; k < 12; k++) {
        const v = int(20);
        const specs: Spec[] = [
          { op: "insertHead", v },
          { op: "insertTail", v },
          { op: "insertAt", pos: int(ref.length + 3) - 1, v },
          { op: "removeAt", pos: int(ref.length + 3) - 1 },
          { op: "removeValue", v },
          { op: "search", v },
        ];
        const s = specs[int(specs.length)];
        const op = run(kind, list, s);
        const { out, error } = model(ref, s);

        assertWellFormed(op, kind);
        expect(vals(op.final), JSON.stringify({ kind, s, ref })).toEqual(out);
        const last = op.steps[op.steps.length - 1];
        expect(vals(last.nodes)).toEqual(out);
        if (error) {
          expect(last.error).toBe(true);
        } else if (kind !== "simples" && s.op !== "search") {
          expect(linksConsistent(last.links, out.length, kind), JSON.stringify({ kind, s, ref })).toBe(true);
        }
        // Cresce no máximo 12 nós; os passos não explodem.
        expect(op.steps.length).toBeLessThan(80);
        list = op.final;
        ref = out;
      }
    }
  });

  it("posição inválida não altera a lista", () => {
    const L = listOps(kind);
    for (const bad of [-1, 9, Number.NaN, 1.5]) {
      const a = L.insertAt(mkList(3, 8, 15), bad, 5);
      const b = L.removeAt(mkList(3, 8, 15), bad);
      for (const r of [a, b]) {
        expect(r.steps[0].error).toBe(true);
        expect(vals(r.final)).toEqual([3, 8, 15]);
      }
    }
  });

  it("operações em lista vazia", () => {
    const L = listOps(kind);
    expect(vals(L.insertHead([], 1).final)).toEqual([1]);
    expect(vals(L.insertTail([], 1).final)).toEqual([1]);
    expect(vals(L.insertAt([], 0, 1).final)).toEqual([1]);
    expect(L.removeAt([], 0).steps[0].error).toBe(true);
    expect(lastOf(L.removeValue([], 1).steps).error).toBe(true);
    expect(lastOf(L.search([], 1).steps).error).toBe(true);
  });

  it("buscar devolve a posição ou -1", () => {
    const L = listOps(kind);
    const hit = L.search(mkList(3, 8, 15), 8);
    const miss = L.search(mkList(3, 8, 15), 77);
    expect(lastOf(hit.steps).vars.retorno).toBe("1");
    expect(lastOf(miss.steps).vars.retorno).toBe("-1");
  });
});

describe("lista dupla: estados intermediários", () => {
  it("inserirInicio liga prox antes de ant (meio-ligado)", () => {
    const op = listOps("dupla").insertHead(mkList(3, 8), 1);
    const half = op.steps.find((s) => s.line === 2)!;
    // novo.prox já aponta para a cabeça antiga, mas ela ainda não aponta de volta.
    expect(half.links!.prox[0]).toBe(1);
    expect(half.links!.ant![1]).toBeNull();
    const full = op.steps.find((s) => s.line === 3)!;
    expect(full.links!.ant![1]).toBe(0);
  });

  it("inserirFim usa a cauda e não percorre a lista", () => {
    const op = listOps("dupla").insertTail(mkList(3, 8, 15, 20), 9);
    expect(op.steps.every((s) => s.line !== 4 || s.pointers.cauda === null)).toBe(true);
    expect(op.steps.length).toBeLessThanOrEqual(6);
    expect(op.steps.some((s) => "atual" in s.pointers)).toBe(false);
  });

  it("inserirEm no meio: o vizinho da direita volta a apontar antes de atual.prox mudar", () => {
    const op = listOps("dupla").insertAt(mkList(3, 8, 15), 1, 5);
    const l8 = op.steps.find((s) => s.line === 8)!;
    const l9 = op.steps.find((s) => s.line === 9)!;
    // pos = 1: novo no índice 1; vizinho da direita no índice 2; atual no índice 0.
    expect(l8.links!.ant![2]).toBe(1);
    expect(l8.links!.prox[0]).toBe(2); // atual.prox ainda aponta para o vizinho antigo
    expect(l9.links!.prox[0]).toBe(1);
  });

  it("removerEm usa alvo.ant, sem ponteiro 'anterior'", () => {
    const op = listOps("dupla").removeAt(mkList(3, 8, 15), 1);
    expect(op.steps.some((s) => "anterior" in s.pointers)).toBe(false);
    expect(vals(op.final)).toEqual([3, 15]);
  });
});

describe("lista circular: sem null e com parada na cabeça", () => {
  it("a lista final nunca tem prox null", () => {
    const L = listOps("circular");
    for (const op of [
      L.insertHead(mkList(3, 8), 1),
      L.insertTail(mkList(3, 8), 1),
      L.insertAt(mkList(3, 8), 2, 1),
      L.removeAt(mkList(3, 8, 15), 0),
      L.removeAt(mkList(3, 8, 15), 2),
    ]) {
      const last = lastOf(op.steps);
      expect(last.links!.prox.every((t) => t !== null)).toBe(true);
    }
  });

  it("inserirFim passa por um estado com o círculo aberto e depois o fecha", () => {
    const op = listOps("circular").insertTail(mkList(3, 8), 1);
    const open = op.steps.find((s) => s.line === 6)!;
    expect(open.links!.prox[2]).toBeNull(); // novo ainda não volta à cabeça
    expect(lastOf(op.steps).links!.prox[2]).toBe(0);
  });

  it("inserirInicio: o último só passa a apontar para o novo nó depois de novo.prox", () => {
    const op = listOps("circular").insertHead(mkList(3, 8), 1);
    const l6 = op.steps.find((s) => s.line === 6)!;
    const l7 = op.steps.find((s) => s.line === 7)!;
    // nós: [novo, 3, 8]; o último (8) está no índice 2.
    expect(l6.links!.prox[0]).toBe(1); // novo.prox = cabeça antiga
    expect(l6.links!.prox[2]).toBe(1); // o último ainda aponta para a cabeça antiga
    expect(l7.links!.prox[2]).toBe(0); // agora aponta para o novo nó
  });

  it("remover a cabeça passa por um estado em que o último ainda aponta para o nó removido", () => {
    const op = listOps("circular").removeAt(mkList(3, 8, 15), 0);
    const stale = op.steps.find((s) => s.line === 6)!;
    expect(stale.links!.prox[2]).toBe(0);
    expect(stale.removing).toBe(stale.nodes[0].id);
    const fixed = op.steps.find((s) => s.line === 7)!;
    expect(fixed.links!.prox[2]).toBe(1);
  });

  it("remover o único nó deixa a lista vazia", () => {
    const op = listOps("circular").removeAt(mkList(7), 0);
    expect(vals(op.final)).toEqual([]);
  });

  it("buscar termina ao voltar à cabeça quando não encontra", () => {
    const op = listOps("circular").search(mkList(3, 8, 15), 77);
    const wrap = lastOf(op.steps.filter((s) => s.line === 6));
    expect(wrap.predict).toBeDefined();
    expect(lastOf(op.steps).error).toBe(true);
  });
});

describe("links", () => {
  it("chain monta ligações consistentes", () => {
    expect(chain(3, "simples").prox).toEqual([1, 2, null]);
    expect(chain(3, "circular").prox).toEqual([1, 2, 0]);
    expect(chain(3, "dupla").ant).toEqual([null, 0, 1]);
    expect(chain(0, "circular").prox).toEqual([]);
    expect(chain(1, "circular").prox).toEqual([0]);
  });

  it("linksConsistent detecta ligação faltando", () => {
    const l = chain(3, "dupla");
    expect(linksConsistent(l, 3, "dupla")).toBe(true);
    l.ant![1] = null;
    expect(linksConsistent(l, 3, "dupla")).toBe(false);
    expect(linksConsistent(undefined, 3, "dupla")).toBe(false);
  });
});
