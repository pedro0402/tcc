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

  it("operação sem prompt devolve undefined (ex.: peek)", () => {
    expect(selfExplainFor("peek")).toBeUndefined();
    expect(selfExplainFor("idle")).toBeUndefined();
  });
});
