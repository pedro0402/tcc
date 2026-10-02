import { describe, expect, it } from "vitest";
import { listInsertTail, mk } from "../viva/engine";
import { scriptFromOp } from "./fromOp";
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

describe("scriptFromOp", () => {
  it("preserva código, estrutura e destaque de linha do motor", () => {
    const list = [3, 8].map(mk);
    const op = listInsertTail(list, 15);
    const script = scriptFromOp(op, { id: "t", title: "Inserir no fim" });

    expect(script.kind).toBe("linkedList");
    expect(script.code).toEqual(op.code);
    expect(script.frames).toHaveLength(op.steps.length);
    script.frames.forEach((frame, i) => {
      expect(frame.line).toBe(op.steps[i].line);
      expect(frame.order.map((id) => Number(id))).toEqual(op.steps[i].nodes.map((n) => n.id));
    });
    const last = script.frames.at(-1)!;
    expect(last.order).toHaveLength(3);
  });
});
