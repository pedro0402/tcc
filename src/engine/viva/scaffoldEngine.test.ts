import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { runOps } from "./runOps";
import { deriveDoSteps, doAnswerText } from "./doStage";
import { makeChallenge, makeRng, matchesTarget } from "./challenge";

describe("runOps", () => {
  it("pilha: push e pop batem com o esperado", () => {
    expect(runOps("stack", "simples", [12, 7], [{ op: "push", value: 42 }]).values).toEqual([42, 12, 7]);
    expect(runOps("stack", "simples", [12, 7], [{ op: "pop" }]).values).toEqual([7]);
  });

  it("conta erros sem interromper a sequência", () => {
    // pop em pilha vazia é underflow (erro), mas o push seguinte acontece.
    const r = runOps("stack", "simples", [], [{ op: "pop" }, { op: "push", value: 5 }]);
    expect(r.errors).toBe(1);
    expect(r.values).toEqual([5]);
  });

  it("lista: sequência de inserções e remoções nas três variantes", () => {
    for (const kind of ["simples", "dupla", "circular"] as const) {
      const r = runOps("linkedList", kind, [3, 8, 15], [
        { op: "insertHead", value: 1 },
        { op: "removeValue", value: 8 },
        { op: "insertTail", value: 9 },
      ]);
      expect(r.values, kind).toEqual([1, 3, 15, 9]);
      expect(r.errors, kind).toBe(0);
    }
  });

  it("posição inválida conta erro e não muda a lista", () => {
    const r = runOps("linkedList", "simples", [3, 8], [{ op: "removeAt", pos: 9 }]);
    expect(r.errors).toBe(1);
    expect(r.values).toEqual([3, 8]);
  });
});

describe("deriveDoSteps", () => {
  it("gera perguntas de ponteiro a partir dos passos do push", () => {
    const op = E.stackPush([E.mk(12), E.mk(7)], 42);
    const steps = deriveDoSteps(op);
    expect(steps.length).toBeGreaterThan(0);
    for (const d of steps) {
      // o passo existe e a resposta é um id presente nesse passo (ou null)
      expect(d.stepIndex).toBeGreaterThan(0);
      expect(d.stepIndex).toBeLessThan(op.steps.length);
      if (d.answerId !== null) {
        expect(op.steps[d.stepIndex].nodes.some((n) => n.id === d.answerId)).toBe(true);
      }
      expect(d.question).toContain(d.pointer);
    }
  });

  it("em algum passo o topo passa a apontar para o novo nó", () => {
    const nodes = [E.mk(12), E.mk(7)];
    const op = E.stackPush(nodes, 42);
    const steps = deriveDoSteps(op);
    const topoMove = steps.find((d) => d.pointer === "topo");
    expect(topoMove).toBeDefined();
    // o destino do topo é o nó recém-criado (valor 42)
    expect(doAnswerText(op, topoMove!)).toBe("42");
  });

  it("inserirInicio da lista simples tem ao menos uma pergunta de ponteiro", () => {
    const op = E.listInsertHead([E.mk(3), E.mk(8)], 1);
    expect(deriveDoSteps(op).length).toBeGreaterThan(0);
  });
});

describe("makeChallenge", () => {
  it("é determinístico para a mesma semente", () => {
    const a = makeChallenge("stack", "simples", [5], 123);
    const b = makeChallenge("stack", "simples", [5], 123);
    expect(a).toEqual(b);
  });

  it("o alvo é atingível pela solução e diferente do inicial", () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const [structure, kind, initial] of [
        ["stack", "simples", [12, 7]],
        ["linkedList", "simples", [3, 8, 15]],
        ["linkedList", "dupla", [3, 8, 15]],
        ["linkedList", "circular", [3, 8, 15]],
      ] as const) {
        const c = makeChallenge(structure, kind, [...initial], seed);
        const reached = runOps(structure, kind, [...initial], c.solution);
        expect(reached.errors, `${structure}/${kind}/${seed}`).toBe(0);
        expect(reached.values, `${structure}/${kind}/${seed}`).toEqual(c.target);
        expect(c.target, `${structure}/${kind}/${seed}`).not.toEqual(c.initial);
      }
    }
  });

  it("gera desafio mesmo a partir de estrutura vazia", () => {
    const c = makeChallenge("linkedList", "simples", [], 7);
    expect(c.target.length).toBeGreaterThan(0);
  });

  it("matchesTarget compara por valor e ordem", () => {
    expect(matchesTarget([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(matchesTarget([1, 2], [2, 1])).toBe(false);
    expect(matchesTarget([], [])).toBe(true);
  });

  it("makeRng é reproduzível", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
