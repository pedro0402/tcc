import { describe, expect, it } from "vitest";
import { insertTailHomeScript } from "./scripts";

describe("insertTailHomeScript", () => {
  it("cada linha de código tem um frame que a executa", () => {
    const script = insertTailHomeScript();
    expect(script.code).toHaveLength(3);
    const lines = script.frames.map((f) => f.line).filter((l) => l >= 0);
    expect(lines).toEqual([0, 1, 2]);
    script.frames.forEach((f) => {
      if (f.line >= 0) expect(f.line).toBeLessThan(script.code.length);
    });
  });

  it("o novo nó só entra na cadeia quando atual.proximo = novo", () => {
    const script = insertTailHomeScript();
    const created = script.frames.find((f) => f.line === 0)!;
    const linked = script.frames.find((f) => f.line === 1)!;
    const done = script.frames.find((f) => f.line === 2)!;

    expect(created.order).toEqual(["n3", "n8"]);
    expect(created.incomingIds).toEqual(["n15"]);
    expect(created.connecting).toEqual({ from: "n15", to: null });

    expect(linked.order).toEqual(["n3", "n8", "n15"]);
    expect(linked.connecting).toEqual({ from: "n8", to: "n15" });

    expect(done.order).toEqual(["n3", "n8", "n15"]);
    expect(done.pointers.cabeça).toBe("n3");
  });
});
