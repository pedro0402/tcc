import { describe, it, expect } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("push gera passos terminando com o valor no topo", () => {
    const stack = new Stack();
    const steps = stack.push(5);
    const last = steps[steps.length - 1];

    expect(last.kind).toBe("done");
    expect(last.snapshot.nodes.map((n) => n.value)).toEqual([5]);
  });

  it("pop remove o elemento do topo", () => {
    const stack = new Stack();
    stack.push(1);
    stack.push(2);
    const steps = stack.pop();
    const last = steps[steps.length - 1];

    expect(last.snapshot.nodes.map((n) => n.value)).toEqual([1]);
  });

  it("pop em pilha vazia sinaliza underflow", () => {
    const stack = new Stack();
    const steps = stack.pop();

    expect(steps).toHaveLength(1);
    expect(steps[0].description).toContain("vazia");
  });

  it("snapshot inicial segue o seed", () => {
    const stack = new Stack([3, 8, 1]);
    expect(stack.getValues()).toEqual([3, 8, 1]);
    expect(stack.snapshot().nodes.map((n) => n.value)).toEqual([3, 8, 1]);
  });
});
