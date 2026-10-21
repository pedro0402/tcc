import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("avisa que a página não existe e oferece caminhos", () => {
    const html = renderToStaticMarkup(createElement(NotFoundPage));
    expect(html).toContain("Não achamos esta página");
    expect(html).toContain('href="#/estruturas"');
    expect(html).toContain('href="#/"');
  });

  it("na rota reservada, diz que está em construção", () => {
    const html = renderToStaticMarkup(createElement(NotFoundPage, { soon: true }));
    expect(html).toContain("em construção");
  });
});
