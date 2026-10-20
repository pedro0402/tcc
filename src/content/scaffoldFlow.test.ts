import { describe, expect, it } from "vitest";
import * as E from "../engine/viva/engine";
import type { Structure } from "../engine/viva/engine";
import { listOps } from "../engine/viva/lists";
import type { ListKind } from "../engine/viva/links";
import { opFromSpec } from "../engine/viva/runOps";
import { nodesFromValues } from "../engine/viva/initialState";
import { observeScript, previewScript } from "./scaffoldScripts";
import { keyStepsFor } from "./workedExamples";

// Simula a escada como a UI roda: o Observar parte do estado inicial do roteiro
// e o Prever herda o estado final do Observar. Cada operação do Prever precisa
// abrir pelo menos uma previsão; cada uma do Observar, pelo menos uma pausa.
const CASES: Array<[Structure, ListKind]> = [
  ["stack", "simples"],
  ["linkedList", "simples"],
  ["linkedList", "dupla"],
  ["linkedList", "circular"],
];

describe.each(CASES)("roteiro de %s (%s)", (structure, kind) => {
  const observe = observeScript(structure);
  let nodes = nodesFromValues(observe.initial);
  const observed = observe.steps.map((st) => {
    const op = opFromSpec(structure, kind, nodes, st.spec);
    nodes = op.final;
    return { caption: st.caption, op };
  });
  const previewed = previewScript(structure).map((st) => {
    const op = opFromSpec(structure, kind, nodes, st.spec);
    nodes = op.final;
    return { caption: st.caption, op };
  });

  it.each(observed.map((o) => [o.caption, o.op] as const))("Observar pausa para comentar: %s", (_c, op) => {
    expect(keyStepsFor(op).length).toBeGreaterThan(0);
  });

  it.each(previewed.map((o) => [o.caption, o.op] as const))("Prever pergunta algo: %s", (_c, op) => {
    expect(op.steps.some((s) => s.predict)).toBe(true);
    // A previsão nunca fica no passo 0 (o player só pergunta ao avançar).
    expect(op.steps[0].predict).toBeUndefined();
  });
});

describe("casos de borda que antes não tinham previsão", () => {
  const l = () => [11, 3, 4].map(E.mk);
  const one = () => [E.mk(7)];
  const ops: Array<[string, E.Op]> = [
    ["simples removeAt(0)", listOps("simples").removeAt(l(), 0)],
    ["simples removeAt(0) com um nó", listOps("simples").removeAt(one(), 0)],
    ["simples insertTail vazia", listOps("simples").insertTail([], 1)],
    ["dupla insertHead vazia", listOps("dupla").insertHead([], 1)],
    ["dupla insertTail vazia", listOps("dupla").insertTail([], 1)],
    ["dupla removeValue ausente", listOps("dupla").removeValue(l(), 99)],
    ["circular insertHead vazia", listOps("circular").insertHead([], 1)],
    ["circular insertTail vazia", listOps("circular").insertTail([], 1)],
    ["circular removeAt com um nó", listOps("circular").removeAt(one(), 0)],
    ["circular removeValue ausente", listOps("circular").removeValue(l(), 99)],
  ];
  it.each(ops)("%s tem previsão com resposta válida", (_n, op) => {
    const asks = op.steps.filter((s) => s.predict);
    expect(asks.length).toBeGreaterThan(0);
    for (const s of asks) {
      const p = s.predict!;
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThan(p.options.length);
      expect(new Set(p.options).size).toBe(p.options.length);
      expect(p.misconceptions?.[p.answer]).toBeUndefined();
    }
  });
});
