import { describe, expect, it } from "vitest";
import { labHref, labLabel, parseLabParams } from "./labParams";
import { parseHashParams } from "./useHashRoute";

describe("parâmetros do simulador", () => {
  it("lê estrutura e tipo de lista", () => {
    expect(parseLabParams({ s: "list", k: "dupla" })).toEqual({ structure: "linkedList", kind: "dupla" });
    expect(parseLabParams({ s: "stack" })).toEqual({ structure: "stack", kind: "simples" });
  });

  it("sem parâmetros ou com valores inválidos, cai na lista simples", () => {
    expect(parseLabParams({})).toEqual({ structure: "linkedList", kind: "simples" });
    expect(parseLabParams({ s: "list", k: "tripla" })).toEqual({ structure: "linkedList", kind: "simples" });
    expect(parseLabParams({ s: "stack", k: "dupla" })).toEqual({ structure: "stack", kind: "simples" });
  });

  it("ida e volta pelo link", () => {
    for (const kind of ["simples", "dupla", "circular"] as const) {
      expect(parseLabParams(parseHashParams(labHref("linkedList", kind)))).toEqual({ structure: "linkedList", kind });
    }
    expect(parseLabParams(parseHashParams(labHref("stack")))).toEqual({ structure: "stack", kind: "simples" });
    expect(labHref("linkedList")).toBe("#/lab?s=list");
  });

  it("nomes exibidos", () => {
    expect(labLabel({ structure: "stack", kind: "simples" })).toBe("Pilha");
    expect(labLabel({ structure: "linkedList", kind: "circular" })).toBe("Lista circular");
  });
});
