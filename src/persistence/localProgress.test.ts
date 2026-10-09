import { beforeEach, describe, expect, it } from "vitest";
import { eventStore, type LearningEvent } from "../learning/events";
import {
  deriveProgress,
  getLocalProgress,
  recordOperationComplete,
  recordPrediction,
  recordQuizAttempt,
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
});
