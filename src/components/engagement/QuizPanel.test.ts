import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QUIZ_SETS } from "../../content/quiz";
import { QuizPanel } from "./QuizPanel";

const render = (setIndex: number) =>
  renderToStaticMarkup(createElement(QuizPanel, { set: QUIZ_SETS[setIndex], onAnswer: () => {} }));

describe("QuizPanel (primeira tela)", () => {
  it.each(QUIZ_SETS.map((s, i) => [s.label, i] as const))("%s mostra a 1ª pergunta e todas as alternativas", (_label, i) => {
    const set = QUIZ_SETS[i];
    const html = render(i);
    const q = set.questions[0];
    expect(html).toContain(`${set.label} · 1 de ${set.questions.length}`.replace(/&/g, "&amp;"));
    expect(html).toContain(q.prompt.replace(/&/g, "&amp;"));
    for (const opt of q.options) expect(html).toContain(opt.replace(/&/g, "&amp;"));
  });

  it("antes de responder não mostra explicação, marcas nem botão Próxima", () => {
    const html = render(0);
    expect(html).not.toContain("correta");
    expect(html).not.toContain("sua resposta");
    expect(html).not.toContain("Próxima");
    expect(html).not.toContain(QUIZ_SETS[0].questions[0].explanation);
  });
});
