import { describe, expect, it } from "vitest";
import { correctCount, initialQuizState, isFinished, quizReducer, type QuizAction, type QuizState } from "./quizReducer";

const run = (s: QuizState, ...a: QuizAction[]) => a.reduce(quizReducer, s);

describe("quizReducer", () => {
  it("responder guarda a escolha e o resultado", () => {
    const s = run(initialQuizState, { type: "ANSWER", choice: 2, correct: true });
    expect(s.selected).toBe(2);
    expect(s.results).toEqual([true]);
    expect(s.index).toBe(0);
  });

  it("só a primeira resposta de cada pergunta vale", () => {
    const once = run(initialQuizState, { type: "ANSWER", choice: 1, correct: false });
    const twice = run(once, { type: "ANSWER", choice: 3, correct: true });
    expect(twice).toBe(once);
    expect(twice.results).toEqual([false]);
  });

  it("não avança sem responder", () => {
    expect(run(initialQuizState, { type: "NEXT" })).toBe(initialQuizState);
  });

  it("avançar limpa a seleção e mantém os resultados", () => {
    const s = run(initialQuizState, { type: "ANSWER", choice: 0, correct: true }, { type: "NEXT" });
    expect(s).toEqual({ index: 1, selected: null, results: [true] });
  });

  it("percorre o quiz inteiro e conta os acertos", () => {
    let s = initialQuizState;
    const outcomes = [true, false, true];
    for (const ok of outcomes) s = run(s, { type: "ANSWER", choice: 0, correct: ok }, { type: "NEXT" });
    expect(isFinished(s, 3)).toBe(true);
    expect(isFinished({ ...s, index: 2 }, 3)).toBe(false);
    expect(correctCount(s)).toBe(2);
    expect(s.results).toEqual(outcomes);
  });

  it("RESET volta ao começo", () => {
    const s = run(initialQuizState, { type: "ANSWER", choice: 0, correct: true }, { type: "NEXT" }, { type: "RESET" });
    expect(s).toEqual(initialQuizState);
  });
});
