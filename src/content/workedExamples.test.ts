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

  it("operação sem exemplo devolve lista vazia", () => {
    expect(keyStepsFor(E.stackPeek(sampleStack()))).toEqual([]);
  });
});
