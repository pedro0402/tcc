import { describe, expect, it } from "vitest";
import { MAX_INITIAL_NODES, nodesFromValues, nodesToText, parseInitialState } from "./initialState";
import { mk } from "./engine";

describe("parseInitialState", () => {
  it("aceita vírgulas, espaços ou os dois", () => {
    expect(parseInitialState("3, 8, 15")).toEqual({ ok: true, values: [3, 8, 15] });
    expect(parseInitialState("3 8 15")).toEqual({ ok: true, values: [3, 8, 15] });
    expect(parseInitialState("3,8 , 15")).toEqual({ ok: true, values: [3, 8, 15] });
  });

  it("vazio é uma estrutura vazia", () => {
    expect(parseInitialState("")).toEqual({ ok: true, values: [] });
    expect(parseInitialState("   ")).toEqual({ ok: true, values: [] });
  });

  it("aceita negativos e preserva repetidos e ordem", () => {
    expect(parseInitialState("-2, 5, 5, -2")).toEqual({ ok: true, values: [-2, 5, 5, -2] });
  });

  it("recusa não inteiros", () => {
    expect(parseInitialState("3, a, 5").ok).toBe(false);
    expect(parseInitialState("1.5").ok).toBe(false);
    expect(parseInitialState("3; 8").ok).toBe(false); // ; não é separador
  });

  it("recusa acima do limite", () => {
    const demais = Array.from({ length: MAX_INITIAL_NODES + 1 }, (_, i) => i).join(" ");
    const r = parseInitialState(demais);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(`${MAX_INITIAL_NODES}`);
    // no limite exato, passa
    const noLimite = Array.from({ length: MAX_INITIAL_NODES }, (_, i) => i).join(" ");
    expect(parseInitialState(noLimite).ok).toBe(true);
  });

  it("recusa inteiro grande demais", () => {
    expect(parseInitialState("99999999999999999999").ok).toBe(false);
  });
});

describe("nodesToText / nodesFromValues", () => {
  it("ida e volta", () => {
    const nodes = [3, 8, 15].map(mk);
    expect(nodesToText(nodes)).toBe("3, 8, 15");
    expect(nodesToText([])).toBe("");
    expect(nodesFromValues([1, 2]).map((n) => n.value)).toEqual([1, 2]);
  });

  it("os nós criados têm ids distintos", () => {
    const nodes = nodesFromValues([5, 5, 5]);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(3);
  });
});
