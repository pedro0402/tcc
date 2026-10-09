import { describe, expect, it } from "vitest";
import { QUIZ_SETS, quizSetById } from "./quiz";

const all = QUIZ_SETS.flatMap((s) => s.questions.map((q) => ({ set: s.id, q })));

describe("banco de perguntas", () => {
  it("ids de conjuntos e de perguntas são únicos", () => {
    expect(new Set(QUIZ_SETS.map((s) => s.id)).size).toBe(QUIZ_SETS.length);
    const ids = all.map((x) => x.q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mantém os ids que já existiam em eventos salvos", () => {
    const ids = new Set(all.map((x) => x.q.id));
    for (const legacy of ["stack-lifo", "stack-underflow", "stack-top", "ll-next", "ll-head", "ll-insert-head"]) {
      expect(ids.has(legacy), legacy).toBe(true);
    }
  });

  it.each(all)("$q.id: resposta existe, alternativas distintas e há explicação", ({ q }) => {
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(Number.isInteger(q.answerIndex)).toBe(true);
    expect(q.options[q.answerIndex]).toBeDefined();
    expect(q.prompt.trim().length).toBeGreaterThan(10);
    expect(q.explanation.trim().length).toBeGreaterThan(20);
  });

  it("cada conjunto tem ao menos 4 perguntas e cobre sua estrutura", () => {
    for (const s of QUIZ_SETS) expect(s.questions.length, s.id).toBeGreaterThanOrEqual(4);
    expect(QUIZ_SETS.filter((s) => s.structure === "stack")).toHaveLength(1);
    expect(QUIZ_SETS.filter((s) => s.variant === "dupla")).toHaveLength(1);
    expect(QUIZ_SETS.filter((s) => s.variant === "circular")).toHaveLength(1);
  });

  it("a resposta certa não fica sempre na mesma posição", () => {
    const positions = new Set(all.map((x) => x.q.answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });

  it("quizSetById acha ou devolve undefined", () => {
    expect(quizSetById("pilha")?.structure).toBe("stack");
    expect(quizSetById("nao-existe")).toBeUndefined();
  });
});
