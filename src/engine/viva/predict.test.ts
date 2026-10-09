import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { listOps } from "./lists";
import { MISCONCEPTIONS, type MisconceptionId } from "../../content/misconceptions";

// Todas as operações que produzem previsões, nas três variantes de lista.
function everyPredict() {
  const ops: E.Op[] = [
    E.stackPush([E.mk(1)], 2),
    E.stackPop([E.mk(1)]),
    E.stackPop([]),
  ];
  for (const kind of ["simples", "dupla", "circular"] as const) {
    const L = listOps(kind);
    const base = () => [3, 8, 15].map(E.mk);
    ops.push(
      L.insertHead(base(), 1),
      L.insertTail(base(), 9),
      L.insertAt(base(), 1, 5),
      L.removeAt(base(), 1),
      L.removeAt(base(), 0),
      L.removeValue(base(), 8),
      L.search(base(), 77),
    );
  }
  return ops.flatMap((op) => op.steps.map((s) => s.predict).filter((p): p is E.Predict => !!p));
}

describe("ask() — alternativas ricas", () => {
  it("aceita strings e objetos juntos, mantendo o acerto após embaralhar", () => {
    const p = E.ask(
      "pergunta",
      "certa",
      [{ text: "errada A", misconception: "no-vs-ponteiro" }, "errada B"],
      { id: "x", concept: "pilha.topo", explain: "porque sim" },
    );
    expect(p.options).toContain("certa");
    expect(p.options[p.answer]).toBe("certa");
    expect(p.misconceptions?.[p.answer]).toBeUndefined();
    expect(p.options).toHaveLength(3);
    expect(p.id).toBe("x");
    expect(p.concept).toBe("pilha.topo");
  });

  it("remove alternativas repetidas pelo texto", () => {
    const p = E.ask("q", "a", ["a", "b", "b"]);
    expect(p.options).toEqual(expect.arrayContaining(["a", "b"]));
    expect(p.options).toHaveLength(2);
  });

  it("o engano acompanha a alternativa mesmo após o embaralhamento", () => {
    for (let i = 0; i < 50; i++) {
      const p = E.ask("q", "certa", [{ text: "x", misconception: "lifo-vs-fifo" }]);
      const xi = p.options.indexOf("x");
      expect(p.misconceptions?.[xi]).toBe("lifo-vs-fifo");
      expect(p.misconceptions?.[p.answer]).toBeUndefined();
    }
  });
});

describe("previsões do motor", () => {
  const predicts = everyPredict();

  it("existem previsões para exercitar", () => {
    expect(predicts.length).toBeGreaterThan(10);
  });

  it("toda previsão tem id, conceito e explicação", () => {
    for (const p of predicts) {
      expect(p.id, p.question).toBeTruthy();
      expect(p.concept, p.question).toBeTruthy();
      expect((p.explain ?? "").length, p.question).toBeGreaterThan(15);
    }
  });

  it("ids iguais sempre têm a mesma pergunta (reaproveitamento é permitido)", () => {
    // Operações que delegam para outra (insertAt pos 0, removeValue circular)
    // reaproveitam a mesma previsão: o id pode repetir, desde que seja a mesma pergunta.
    const byId = new Map<string, string>();
    for (const p of predicts) {
      const prev = byId.get(p.id!);
      if (prev !== undefined) expect(p.question, `id ${p.id} com perguntas diferentes`).toBe(prev);
      byId.set(p.id!, p.question);
    }
  });

  it("a alternativa certa não tem engano; os enganos citados existem no catálogo", () => {
    for (const p of predicts) {
      expect(p.misconceptions?.[p.answer]).toBeUndefined();
      for (const m of p.misconceptions ?? []) {
        if (m) expect(MISCONCEPTIONS[m as MisconceptionId], `${p.id}: ${m}`).toBeDefined();
      }
    }
  });

  it("pelo menos uma alternativa errada aponta um engano em cada previsão", () => {
    for (const p of predicts) {
      const temEngano = (p.misconceptions ?? []).some((m, i) => m && i !== p.answer);
      expect(temEngano, `previsão sem nenhum engano mapeado: ${p.id}`).toBe(true);
    }
  });
});

describe("catálogo de erros conceituais", () => {
  it("cada entrada tem título e explicação, e a chave bate com o id", () => {
    for (const [key, m] of Object.entries(MISCONCEPTIONS)) {
      expect(m.id).toBe(key);
      expect(m.title.length).toBeGreaterThan(5);
      expect(m.explain.length).toBeGreaterThan(20);
    }
  });
});
