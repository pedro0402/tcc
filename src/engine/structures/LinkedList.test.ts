import { describe, it, expect } from "vitest";
import { LinkedList } from "./LinkedList";

describe("LinkedList", () => {
  it("insertAtHead coloca o valor no início", () => {
    const list = new LinkedList();
    list.insertAtHead(2);
    const steps = list.insertAtHead(1);
    const last = steps[steps.length - 1];

    expect(last.kind).toBe("done");
    expect(last.snapshot.nodes.map((n) => n.value)).toEqual([1, 2]);
    expect(last.snapshot.nodes[0].next).toBe(last.snapshot.nodes[1].id);
  });

  it("insertAtTail coloca o valor no fim", () => {
    const list = new LinkedList();
    list.insertAtTail(1);
    const steps = list.insertAtTail(2);
    const last = steps[steps.length - 1];

    expect(last.snapshot.nodes.map((n) => n.value)).toEqual([1, 2]);
  });

  it("remove remove o valor encontrado", () => {
    const list = new LinkedList();
    list.insertAtTail(1);
    list.insertAtTail(2);
    list.insertAtTail(3);
    const steps = list.remove(2);
    const last = steps[steps.length - 1];

    expect(last.snapshot.nodes.map((n) => n.value)).toEqual([1, 3]);
    expect(last.snapshot.nodes[0].next).toBe(last.snapshot.nodes[1].id);
  });

  it("remove em lista vazia não altera o estado", () => {
    const list = new LinkedList();
    const steps = list.remove(1);

    expect(steps).toHaveLength(1);
    expect(steps[0].description).toContain("vazia");
  });

  it("seed monta a lista sem gerar passos", () => {
    const list = new LinkedList([2, 5, 9]);
    expect(list.getValues()).toEqual([2, 5, 9]);
  });
});
