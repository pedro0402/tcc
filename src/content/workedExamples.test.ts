import { describe, expect, it } from "vitest";
import * as E from "../engine/viva/engine";
import { listOps } from "../engine/viva/lists";
import { hasWorkedExample, keyStepsFor } from "./workedExamples";

const sampleStack = () => [12, 7].map(E.mk);
const sampleList = () => [3, 8, 15].map(E.mk);

describe("exemplos resolvidos", () => {
  it("push e pop têm exemplo", () => {
    expect(hasWorkedExample(E.stackPush(sampleStack(), 42))).toBe(true);
    expect(hasWorkedExample(E.stackPop(sampleStack()))).toBe(true);
  });

  it("peek/isEmpty não têm exemplo (são triviais)", () => {
    expect(hasWorkedExample(E.stackPeek(sampleStack()))).toBe(false);
    expect(hasWorkedExample(E.stackIsEmpty(sampleStack()))).toBe(false);
  });

  it("as seis operações de lista têm exemplo nas três variantes", () => {
    for (const kind of ["simples", "dupla", "circular"] as const) {
      const L = listOps(kind);
      for (const op of [
        L.insertHead(sampleList(), 1),
        L.insertTail(sampleList(), 9),
        L.insertAt(sampleList(), 1, 5),
        L.removeAt(sampleList(), 1),
        L.removeValue(sampleList(), 8),
        L.search(sampleList(), 8),
      ]) {
        expect(hasWorkedExample(op), `${op.name}/${kind}`).toBe(true);
      }
    }
  });

  it("keyStepsFor aponta passos reais e em ordem", () => {
    const op = E.stackPush(sampleStack(), 42);
    const keys = keyStepsFor(op);
    expect(keys.length).toBeGreaterThan(0);
    let last = -1;
    for (const k of keys) {
      expect(k.stepIndex).toBeGreaterThanOrEqual(0);
      expect(k.stepIndex).toBeLessThan(op.steps.length);
      expect(k.stepIndex).toBeGreaterThan(last); // estritamente crescente
      expect(k.text.length).toBeGreaterThan(15);
      last = k.stepIndex;
    }
  });

  it("ignora linhas que não ocorrem na operação (ex.: lista vazia)", () => {
    // inserirFim em lista vazia não passa pela linha do laço; não deve quebrar.
    const op = listOps("simples").insertTail([], 1);
    expect(() => keyStepsFor(op)).not.toThrow();
  });

  it("cada comentário cai numa linha que a operação executa, na variante dela", () => {
    for (const kind of ["simples", "dupla", "circular"] as const) {
      const L = listOps(kind);
      // Vários cenários para cobrir ramos (início, meio, fim, ausente).
      const runs = [
        L.insertHead(sampleList(), 1),
        L.insertTail(sampleList(), 9),
        L.insertAt(sampleList(), 1, 5),
        L.removeAt(sampleList(), 0),
        L.removeAt(sampleList(), 1),
        L.removeValue(sampleList(), 8),
        L.removeValue(sampleList(), 99),
        L.search(sampleList(), 8),
        L.search(sampleList(), 99),
      ];
      const linesRun = new Map<string, Set<number>>();
      for (const op of runs) {
        const set = linesRun.get(op.name) ?? new Set<number>();
        op.steps.forEach((s) => set.add(s.line));
        linesRun.set(op.name, set);
      }
      for (const op of runs) {
        // Toda nota deve apontar para alguma linha executada em algum cenário.
        const keys = keyStepsFor(op);
        for (const k of keys) expect(op.steps[k.stepIndex]).toBeDefined();
      }
      for (const [name, set] of linesRun) {
        const op = runs.find((o) => o.name === name)!;
        // Reaproveita keyStepsFor sobre um op sintético que passa por todas as linhas.
        const all = { ...op, steps: [...set].map((line) => ({ ...op.steps[0], line })) };
        const hit = keyStepsFor(all).length;
        expect(hit, `${kind}/${name}: nenhuma nota casou`).toBeGreaterThan(0);
      }
    }
  });

  it("os comentários batem com o código da variante", () => {
    const text = (op: ReturnType<typeof E.stackPush>) =>
      keyStepsFor(op)
        .map((k) => `${op.code[op.steps[k.stepIndex].line]} :: ${k.text}`)
        .join("\n");
    // Na circular, inserir no início é O(n): nenhum comentário pode dizer O(1).
    const cHead = listOps("circular").insertHead(sampleList(), 1);
    expect(text(cHead)).not.toMatch(/O\(1\)/);
    expect(text(cHead)).toMatch(/O\(n\)/);
    // Na dupla, o comentário da linha "cabeca.ant = novo" fala do caminho de volta.
    const dHead = listOps("dupla").insertHead(sampleList(), 1);
    expect(text(dHead)).toMatch(/cabeca\.ant = novo :: .*volta/);
    // Na dupla, inserir no fim usa a cauda (sem percurso).
    expect(text(listOps("dupla").insertTail(sampleList(), 9))).toMatch(/cauda = novo :: .*O\(1\)/);
    // Na circular, a busca não fala de null no fim do laço.
    expect(text(listOps("circular").search(sampleList(), 99))).toMatch(/while \(atual != cabeca\) :: .*cabeça/);
  });

  it("operação sem exemplo devolve lista vazia", () => {
    expect(keyStepsFor(E.stackPeek(sampleStack()))).toEqual([]);
  });
});
