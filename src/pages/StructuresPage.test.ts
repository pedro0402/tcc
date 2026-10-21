import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StructuresPage } from "./StructuresPage";

describe("StructuresPage", () => {
  it("oferece os três tipos de lista e a pilha, cada um com seu link", () => {
    const html = renderToStaticMarkup(createElement(StructuresPage));
    expect(html).toContain('href="#/lab?s=list"');
    expect(html).toContain('href="#/lab?s=list&amp;k=dupla"');
    expect(html).toContain('href="#/lab?s=list&amp;k=circular"');
    expect(html).toContain('href="#/lab?s=stack"');
  });
});
