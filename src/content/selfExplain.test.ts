import { describe, expect, it } from "vitest";
import { selfExplainFor } from "./selfExplain";

const OPS = ["push", "pop", "inserirInicio", "inserirFim", "inserirEm", "removerEm", "removerValor", "buscar"];

describe("autoexplicação", () => {
  it.each(OPS)("tem pergunta e modelo para %s", (op) => {
    const p = selfExplainFor(op);
    expect(p).toBeDefined();
    expect(p!.question.trim().endsWith("?")).toBe(true);
    expect(p!.question.length).toBeGreaterThan(15);
    expect(p!.model.length).toBeGreaterThan(30);
  });

  it("na circular, inserir no início não promete tempo constante", () => {
    const p = selfExplainFor("inserirInicio", "circular")!;
    expect(p.model).not.toMatch(/constante/);
    expect(p.model).toMatch(/O\(n\)/);
  });

  it("na dupla, inserir no fim usa a cauda e não fala em percorrer", () => {
    const p = selfExplainFor("inserirFim", "dupla")!;
    expect(p.question).not.toMatch(/chegar até o fim/);
    expect(p.model).toMatch(/cauda/);
  });

  it("variante sem pergunta própria usa a da lista simples", () => {
    expect(selfExplainFor("inserirEm", "dupla")).toEqual(selfExplainFor("inserirEm"));
    expect(selfExplainFor("buscar", "circular")).toEqual(selfExplainFor("buscar"));
  });

  it("operação sem prompt devolve undefined (ex.: peek)", () => {
    expect(selfExplainFor("peek")).toBeUndefined();
    expect(selfExplainFor("idle")).toBeUndefined();
  });
});
