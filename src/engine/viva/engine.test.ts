import { describe, expect, it } from "vitest";
import * as E from "./engine";
import type { Node, Op } from "./engine";

const vals = (nodes: Node[]) => nodes.map((n) => n.value);
const list = () => [3, 8, 15].map(E.mk);
const stack = () => [12, 7].map(E.mk);

function assertWellFormed(op: Op) {
  expect(op.steps.length).toBeGreaterThan(0);
  op.steps.forEach((s, i) => {
    expect(s.line).toBeLessThan(op.code.length);
    if (s.predict) {
      // Pergunta nunca no primeiro passo: o player pausa antes de revelá-lo.
      expect(i).toBeGreaterThan(0);
      expect(s.predict.answer).toBeGreaterThanOrEqual(0);
      expect(s.predict.options[s.predict.answer]).toBeDefined();
    }
  });
  expect(vals(op.steps[op.steps.length - 1].nodes)).toEqual(vals(op.final));
}

describe("pilha", () => {
  it("push coloca no topo", () => {
    const op = E.stackPush(stack(), 42);
    assertWellFormed(op);
    expect(vals(op.final)).toEqual([42, 12, 7]);
  });

  it("previsão do push revela o passo topo = novo", () => {
    const op = E.stackPush(stack(), 42);
    const i = op.steps.findIndex((s) => s.predict);
    expect(op.code[op.steps[i].line]).toContain("topo = novo");
    const q = op.steps[i].predict!;
    expect(q.options[q.answer]).toBe("topo passa a apontar para o novo nó");
  });

  it("pop remove o topo", () => {
    const op = E.stackPop(stack());
    assertWellFormed(op);
    expect(vals(op.final)).toEqual([7]);
  });

  it("pop em pilha vazia termina em underflow", () => {
    const op = E.stackPop([]);
    assertWellFormed(op);
    expect(op.steps[op.steps.length - 1].error).toBe(true);
  });

  it("peek e isEmpty não mudam a pilha", () => {
    const s = stack();
    expect(vals(E.stackPeek(s).final)).toEqual([12, 7]);
    expect(E.stackIsEmpty([]).steps[1].vars.retorno).toBe("true");
  });
});

describe("lista", () => {
  it("inserirInicio / inserirFim", () => {
    const h = E.listInsertHead(list(), 1);
    const t = E.listInsertTail(list(), 99);
    [h, t].forEach(assertWellFormed);
    expect(vals(h.final)).toEqual([1, 3, 8, 15]);
    expect(vals(t.final)).toEqual([3, 8, 15, 99]);
  });

  it("previsão do inserirInicio revela cabeca = novo", () => {
    const op = E.listInsertHead(list(), 1);
    const s = op.steps.find((x) => x.predict)!;
    expect(op.code[s.line]).toContain("cabeca = novo");
  });

  it("inserirEm posição do meio e posições inválidas", () => {
    const op = E.listInsertAt(list(), 2, 5);
    assertWellFormed(op);
    expect(vals(op.final)).toEqual([3, 8, 5, 15]);
    for (const bad of [-1, 9, Number.NaN, 1.5]) {
      const r = E.listInsertAt(list(), bad, 5);
      expect(r.steps[0].error).toBe(true);
      expect(vals(r.final)).toEqual([3, 8, 15]);
    }
  });

  it("removerEm e posições inválidas (inclui NaN)", () => {
    const op = E.listRemoveAt(list(), 1);
    assertWellFormed(op);
    expect(vals(op.final)).toEqual([3, 15]);
    expect(vals(E.listRemoveAt(list(), 0).final)).toEqual([8, 15]);
    expect(E.listRemoveAt(list(), Number.NaN).steps[0].error).toBe(true);
  });

  it("removerValor usa o próprio código e religa o anterior", () => {
    const op = E.listRemoveValue(list(), 15);
    assertWellFormed(op);
    expect(op.code[0]).toContain("removerValor");
    expect(vals(op.final)).toEqual([3, 8]);
    expect(vals(E.listRemoveValue(list(), 3).final)).toEqual([8, 15]);
    const miss = E.listRemoveValue(list(), 77);
    expect(vals(miss.final)).toEqual([3, 8, 15]);
    expect(miss.steps[miss.steps.length - 1].error).toBe(true);
    expect(E.listRemoveValue([], 1).steps[1].error).toBe(true);
  });

  it("buscar encontra ou retorna -1", () => {
    const hit = E.listSearch(list(), 8);
    const miss = E.listSearch(list(), 77);
    [hit, miss].forEach(assertWellFormed);
    expect(hit.steps[hit.steps.length - 1].vars.retorno).toBe("1");
    expect(miss.steps[miss.steps.length - 1].vars.retorno).toBe("-1");
  });
});
