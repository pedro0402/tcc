import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LivePreview } from "./LivePreview";
import type { DemoScript } from "../../engine/demo/types";

const empty: DemoScript = { id: "vazio", kind: "linkedList", title: "Vazio", code: ["x"], frames: [], holdMs: 500 };

afterEach(() => vi.unstubAllGlobals());

describe("LivePreview", () => {
  it("roteiro sem frames não quebra", () => {
    expect(() => renderToStaticMarkup(createElement(LivePreview, { script: empty }))).not.toThrow();
  });

  it("funciona onde window.matchMedia não existe", () => {
    vi.stubGlobal("window", {});
    expect(() => renderToStaticMarkup(createElement(LivePreview))).not.toThrow();
  });

  it("com movimento reduzido, começa no último frame", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    const html = renderToStaticMarkup(createElement(LivePreview));
    // O último frame do roteiro da Home destaca a última linha do código.
    expect(html).toMatch(/codeOn[^>]*>[^<]*<\/span><\/pre>/);
  });
});
