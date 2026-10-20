import { beforeEach, describe, expect, it } from "vitest";
import { eventStore, type LearningEvent } from "../learning/events";
import {
  deriveProgress,
  getLocalProgress,
  recordOperationComplete,
  recordPrediction,
  recordQuizAttempt,
  recordSelfExplanation,
} from "./localProgress";

const ev = (over: Partial<LearningEvent>): LearningEvent => ({
  id: "x",
  ts: "2026-10-09T12:00:00.000Z",
  approach: "ativa",
  kind: "operation",
  activityId: "a",
  ...over,
});

describe("deriveProgress", () => {
  it("separa operações, previsões e quizzes", () => {
    const p = deriveProgress([
      ev({ kind: "operation", structure: "stack", operation: "push" }),
      ev({ kind: "prediction", structure: "stack", operation: "push", correct: true }),
      ev({ kind: "prediction", structure: "stack", operation: "pop", correct: false }),
      ev({ kind: "quiz", activityId: "stack-lifo", correct: true }),
      ev({ kind: "milestone" }), // não entra em nenhuma lista
    ]);
    expect(p.completedOperations).toHaveLength(1);
    expect(p.predictions.map((x) => x.isCorrect)).toEqual([true, false]);
    expect(p.quizAttempts).toEqual([
      { questionId: "stack-lifo", isCorrect: true, answeredAt: "2026-10-09T12:00:00.000Z" },
    ]);
  });

  it("lista dupla e circular aparecem com o tipo; simples e pilha não", () => {
    const p = deriveProgress([
      ev({ structure: "linkedList", operation: "inserirInicio", variant: "dupla" }),
      ev({ structure: "linkedList", operation: "inserirFim", variant: "circular" }),
      ev({ structure: "linkedList", operation: "buscar", variant: "simples" }),
      ev({ structure: "stack", operation: "push" }),
    ]);
    expect(p.completedOperations.map((o) => o.operation)).toEqual([
      "inserirInicio (dupla)",
      "inserirFim (circular)",
      "buscar",
      "push",
    ]);
  });

  it("evento sem resposta (correct ausente) conta como errado, nunca como certo", () => {
    const p = deriveProgress([ev({ kind: "quiz", activityId: "q" })]);
    expect(p.quizAttempts[0].isCorrect).toBe(false);
  });

  it("sem eventos, tudo vazio", () => {
    expect(deriveProgress([])).toEqual({ completedOperations: [], quizAttempts: [], predictions: [] });
  });
});

describe("record* gravam no log de eventos", () => {
  beforeEach(() => eventStore().clear());

  it("operação, previsão e quiz viram eventos e aparecem no progresso", () => {
    recordOperationComplete("linkedList", "inserirInicio", "dupla");
    recordPrediction("linkedList", "inserirInicio", true, "dupla");
    recordQuizAttempt("ll-head", false);

    const events = eventStore().getEvents();
    expect(events.map((e) => e.kind)).toEqual(["operation", "prediction", "quiz"]);
    expect(events[0]).toMatchObject({
      approach: "ativa",
      naps: "changing",
      structure: "linkedList",
      variant: "dupla",
      activityId: "linkedList:dupla:inserirInicio",
    });
    expect(events[1]).toMatchObject({ naps: "responding", correct: true });
    expect(events[2]).toMatchObject({ activityId: "ll-head", correct: false });

    const p = getLocalProgress();
    expect(p.completedOperations[0].operation).toBe("inserirInicio (dupla)");
    expect(p.predictions).toHaveLength(1);
    expect(p.quizAttempts).toHaveLength(1);
  });

  it("estrutura desconhecida é gravada sem o campo structure", () => {
    recordOperationComplete("arvore", "inserir");
    expect(eventStore().getEvents()[0].structure).toBeUndefined();
  });

  it("autoexplicação vira evento self-explanation (sem guardar o texto no evento)", () => {
    recordSelfExplanation("stack", "push", "o novo nó vira o topo", undefined);
    const e = eventStore().getEvents()[0];
    expect(e).toMatchObject({ kind: "self-explanation", structure: "stack", operation: "push", correct: true });
    // o texto livre não vai para o evento
    expect(JSON.stringify(e)).not.toContain("o novo nó vira o topo");
  });

  it("autoexplicação em branco registra o evento com correct=false", () => {
    recordSelfExplanation("stack", "pop", "   ");
    expect(eventStore().getEvents()[0]).toMatchObject({ kind: "self-explanation", correct: false });
  });
});

describe("texto livre da autoexplicação", () => {
  it("JSON válido mas fora do formato não impede gravar", async () => {
    const { vi } = await import("vitest");
    const { memoryStorage } = await import("../learning/events");
    const ls = memoryStorage();
    ls.setItem("ds-visualizer-self-explanations-v1", "{}");
    vi.stubGlobal("localStorage", ls);
    try {
      recordSelfExplanation("stack", "push", "o topo muda", undefined);
      const saved = JSON.parse(ls.getItem("ds-visualizer-self-explanations-v1")!);
      expect(Array.isArray(saved)).toBe(true);
      expect(saved[0].text).toBe("o topo muda");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
