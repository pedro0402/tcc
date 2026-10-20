import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { linksConsistent } from "./links";

const list = () => [1, 2, 3].map(E.mk);
const byLine = (op: E.Op, line: number) => op.steps.filter((s) => s.line === line);

describe("lista simples: ligações reais nos passos intermediários", () => {
  it("todo passo tem links do tamanho dos nós, com destinos válidos", () => {
    const ops = [
      E.listInsertHead(list(), 9),
      E.listInsertHead([], 9),
      E.listInsertTail(list(), 9),
      E.listInsertTail([], 9),
      E.listInsertAt(list(), 0, 9),
      E.listInsertAt(list(), 2, 9),
      E.listInsertAt(list(), 3, 9),
      E.listRemoveAt(list(), 0),
      E.listRemoveAt(list(), 1),
      E.listRemoveAt(list(), 2),
      E.listRemoveValue(list(), 1),
      E.listRemoveValue(list(), 3),
      E.listRemoveValue(list(), 99),
      E.listSearch(list(), 2),
    ];
    for (const op of ops) {
      for (const s of op.steps) {
        expect(s.links, op.name).toBeDefined();
        expect(s.links!.prox).toHaveLength(s.nodes.length);
        for (const t of s.links!.prox) if (t !== null) expect(t).toBeLessThan(s.nodes.length);
      }
      // O último passo é sempre a lista bem formada.
      const last = op.steps[op.steps.length - 1];
      expect(linksConsistent(last.links, last.nodes.length, "simples"), op.name).toBe(true);
    }
  });

  it("inserirEm: a pergunta 'qual ligação primeiro?' não mostra a resposta", () => {
    const op = E.listInsertAt(list(), 2, 9); // nós: 1, 2, 9, 3
    const created = byLine(op, 5)[0];
    expect(created.nodes.map((n) => n.value)).toEqual([1, 2, 9, 3]);
    expect(created.links!.prox[2]).toBeNull(); // novo ainda sem ligação
    expect(created.links!.prox[1]).toBe(3); // atual (2) ainda aponta para o 3

    const half = byLine(op, 6)[0];
    expect(half.predict).toBeDefined();
    expect(half.links!.prox[2]).toBe(3); // novo.prox = atual.prox
    expect(half.links!.prox[1]).toBe(3); // atual ainda não aponta para o novo

    const done = byLine(op, 7)[0];
    expect(done.links!.prox[1]).toBe(2); // atual.prox = novo
  });

  it("inserirInicio: o nó recém-criado ainda não aponta para a cabeça", () => {
    const op = E.listInsertHead(list(), 9);
    expect(byLine(op, 1)[0].links!.prox[0]).toBeNull();
    expect(byLine(op, 2)[0].links!.prox[0]).toBe(1);
  });

  it("inserirFim: o novo nó aparece desligado até a última linha", () => {
    const op = E.listInsertTail(list(), 9);
    const before = byLine(op, 4);
    for (const s of before) {
      expect(s.nodes).toHaveLength(4);
      expect(s.links!.prox[2]).toBeNull(); // o último original ainda aponta para null
    }
    expect(byLine(op, 6)[0].links!.prox[2]).toBe(3);
  });

  it("remoções: o anterior pula o alvo enquanto o alvo ainda aparece", () => {
    const at = byLine(E.listRemoveAt(list(), 1), 6)[0];
    expect(at.removing).toBeDefined();
    expect(at.links!.prox[0]).toBe(2);
    expect(at.links!.prox[1]).toBe(2); // o alvo ainda aponta para o seguinte

    const byValue = byLine(E.listRemoveValue(list(), 3), 7)[0];
    expect(byValue.links!.prox[1]).toBeNull(); // anterior (2) pula o alvo (3)
  });
});
