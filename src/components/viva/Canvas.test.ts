import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as E from "../../engine/viva/engine";
import type { Step } from "../../engine/viva/engine";
import type { ListKind } from "../../engine/viva/links";
import { chain } from "../../engine/viva/links";
import { listOps } from "../../engine/viva/lists";
import { ListCanvas } from "./Canvas";

const render = (step: Step, kind: ListKind) =>
  renderToStaticMarkup(createElement(ListCanvas, { step, kind }));
const list = (...v: number[]) => v.map(E.mk);
const stepAt = (steps: Step[], line: number) => steps.find((s) => s.line === line)!;

describe("ListCanvas desenhado a partir das ligações", () => {
  it("lista dupla completa: ⇄ entre vizinhos e null nas duas pontas", () => {
    const nodes = list(3, 8, 15);
    const html = render(
      { line: -1, nodes, pointers: {}, highlight: [], message: "", vars: {}, links: chain(3, "dupla") },
      "dupla",
    );
    expect(html.match(/⇄/g)).toHaveLength(2);
    expect(html.match(/>null</g)).toHaveLength(2); // antes da cabeça e depois da cauda
  });

  it("lista dupla meio-ligada mostra o ponteiro que falta", () => {
    const op = listOps("dupla").insertHead(list(3, 8), 1);
    const html = render(stepAt(op.steps, 2), "dupla");
    expect(html).toContain("ant→null"); // a cabeça antiga ainda não aponta de volta
    expect(html).toContain("→"); // novo.prox já aponta para ela
  });

  it("inserirEm na dupla: atual.prox ainda aponta para o vizinho antigo", () => {
    const op = listOps("dupla").insertAt(list(3, 8, 15), 1, 5);
    const html = render(stepAt(op.steps, 8), "dupla");
    expect(html).toContain("prox→8");
  });

  it("lista circular fechada mostra o retorno à cabeça", () => {
    const nodes = list(3, 8, 15);
    const html = render(
      { line: -1, nodes, pointers: {}, highlight: [], message: "", vars: {}, links: chain(3, "circular") },
      "circular",
    );
    expect(html).toContain("↩");
    expect(html).toContain("o último nó aponta de volta para a cabeça (3)");
    expect(html).not.toContain(">null<");
  });

  it("circular com o círculo aberto mostra null no último nó", () => {
    const op = listOps("circular").insertTail(list(3, 8), 1);
    const html = render(stepAt(op.steps, 6), "circular");
    expect(html).not.toContain("↩");
    expect(html).toContain(">null<");
  });

  it("circular com um único nó aponta para si mesmo", () => {
    const op = listOps("circular").insertHead([], 7);
    const html = render(op.steps[op.steps.length - 1], "circular");
    expect(html).toContain("↩");
  });

  it("sem ligações, mantém o desenho antigo da lista simples", () => {
    const op = E.listInsertHead(list(3, 8), 1);
    const html = render(op.steps[op.steps.length - 1], "simples");
    expect(html).toContain(">null<");
    expect(html).not.toContain("↩");
  });
});
