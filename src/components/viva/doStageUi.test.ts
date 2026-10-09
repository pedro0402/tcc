import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as E from "../../engine/viva/engine";
import type { Step } from "../../engine/viva/engine";
import { StackCanvas, ListCanvas } from "./Canvas";

const stackStep = (): Step => E.stackPush([E.mk(12), E.mk(7)], 42).steps[1];
const listStep = (): Step => E.listInsertHead([E.mk(3), E.mk(8)], 1).steps[1];

describe("canvas clicável (estágio Fazer)", () => {
  it("sem onPick, os nós não são botões e o container é uma imagem", () => {
    const html = renderToStaticMarkup(createElement(StackCanvas, { step: stackStep() }));
    expect(html).toContain('role="img"');
    expect(html).not.toContain("<button");
  });

  it("com onPick, cada nó vira um botão com rótulo acessível", () => {
    const html = renderToStaticMarkup(createElement(StackCanvas, { step: stackStep(), onPick: () => {} }));
    expect(html).not.toContain('role="img"');
    const botoes = html.match(/<button/g) ?? [];
    expect(botoes.length).toBe(stackStep().nodes.length);
    expect(html).toContain("Escolher o nó 12");
  });

  it("na lista, onPick também torna os nós clicáveis", () => {
    const semPick = renderToStaticMarkup(createElement(ListCanvas, { step: listStep(), kind: "simples" }));
    const comPick = renderToStaticMarkup(createElement(ListCanvas, { step: listStep(), kind: "simples", onPick: () => {} }));
    expect(semPick).not.toContain("<button");
    expect(comPick).toContain("<button");
    expect(comPick).toContain("Escolher o nó");
  });
});
