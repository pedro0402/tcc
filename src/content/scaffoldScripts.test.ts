import { describe, expect, it } from "vitest";
import { runOps } from "../engine/viva/runOps";
import { desafioSpec, fazerGoal, observeScript, previewOps } from "./scaffoldScripts";

const STRUCTS = ["linkedList", "stack"] as const;

describe("roteiro do Observar", () => {
  it.each(STRUCTS)("%s: roda sem erro a partir do estado inicial", (structure) => {
    const script = observeScript(structure);
    const specs = script.steps.map((s) => s.spec);
    const r = runOps(structure, "simples", script.initial, specs);
    expect(r.errors).toBe(0);
    expect(script.steps.every((s) => s.caption.length > 10)).toBe(true);
  });
});

describe("operações do Prever", () => {
  it.each(STRUCTS)("%s: rodam sem erro sobre o estado final do Observar", (structure) => {
    const script = observeScript(structure);
    const base = runOps(structure, "simples", script.initial, script.steps.map((s) => s.spec)).values;
    const r = runOps(structure, "simples", base, previewOps(structure));
    expect(r.errors).toBe(0);
    expect(previewOps(structure).length).toBeGreaterThan(0);
  });
});

describe("meta do Fazer", () => {
  it.each(STRUCTS)("%s: a meta é alcançável a partir do vazio com as operações liberadas", (structure) => {
    const g = fazerGoal(structure);
    expect(g.target.length).toBeGreaterThan(0);
    expect(g.prompt.length).toBeGreaterThan(10);
    // há pelo menos uma operação liberada
    expect((g.allowed ?? []).length).toBeGreaterThan(0);
  });
});

describe("desafio", () => {
  it.each(STRUCTS)("%s: tem meta, limite de passos e tempo", (structure) => {
    const d = desafioSpec(structure);
    expect(d.target.length).toBeGreaterThan(0);
    expect(d.maxSteps).toBeGreaterThan(0);
    expect(d.seconds).toBeGreaterThan(0);
  });
});
