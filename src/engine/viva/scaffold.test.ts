import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  initialScaffold,
  nextStage,
  remainingToAdvance,
  setStage,
  STAGES,
  type ScaffoldState,
} from "./scaffold";

const at = (stage: ScaffoldState["stage"], clean = 0, errorStreak = 0): ScaffoldState => ({ stage, cleanStreak: clean, errorStreak });
const correct = (hintUsed = false) => ({ correct: true, hintUsed });
const wrong = { correct: false };

describe("ordem dos estágios", () => {
  it("vai de observar a desafio", () => {
    expect([...STAGES]).toEqual(["observar", "prever", "fazer", "desafio"]);
  });

  it("nextStage respeita o topo", () => {
    expect(nextStage("observar")).toBe("prever");
    expect(nextStage("fazer")).toBe("desafio");
    expect(nextStage("desafio")).toBeNull();
  });
});

describe("subida", () => {
  it("sobe após dois acertos limpos seguidos", () => {
    let s = initialScaffold; // observar
    s = applyAttempt(s, correct());
    expect(s.stage).toBe("observar");
    expect(remainingToAdvance(s)).toBe(1);
    s = applyAttempt(s, correct());
    expect(s.stage).toBe("prever");
    expect(s.cleanStreak).toBe(0); // zera ao subir
  });

  it("acerto com dica não conta para subir e zera a sequência", () => {
    let s = at("prever", 1);
    s = applyAttempt(s, correct(true));
    expect(s.stage).toBe("prever");
    expect(s.cleanStreak).toBe(0);
  });

  it("no topo (desafio) não sobe mais, mesmo com vários acertos", () => {
    let s = at("desafio");
    for (let i = 0; i < 5; i++) s = applyAttempt(s, correct());
    expect(s.stage).toBe("desafio");
    expect(remainingToAdvance(s)).toBe(0);
  });

  it("um erro no meio zera a sequência de subida", () => {
    let s = applyAttempt(initialScaffold, correct()); // clean = 1
    s = applyAttempt(s, wrong);
    expect(s.cleanStreak).toBe(0);
    s = applyAttempt(s, correct());
    expect(s.stage).toBe("observar"); // precisa de 2 limpos de novo
  });
});

describe("descida", () => {
  it("desce após dois erros seguidos", () => {
    let s = at("fazer");
    s = applyAttempt(s, wrong);
    expect(s.stage).toBe("fazer");
    expect(s.errorStreak).toBe(1);
    s = applyAttempt(s, wrong);
    expect(s.stage).toBe("prever");
    expect(s.errorStreak).toBe(0);
  });

  it("um acerto no meio zera a sequência de erros", () => {
    let s = applyAttempt(at("fazer"), wrong); // errorStreak = 1
    s = applyAttempt(s, correct());
    expect(s.errorStreak).toBe(0);
    s = applyAttempt(s, wrong);
    expect(s.stage).toBe("fazer"); // ainda não desce
  });

  it("no piso (observar) não desce mais", () => {
    let s = at("observar");
    s = applyAttempt(s, wrong);
    s = applyAttempt(s, wrong);
    expect(s.stage).toBe("observar");
  });
});

describe("troca manual", () => {
  it("define o estágio e zera as sequências", () => {
    const s = setStage(at("observar", 1, 1), "desafio");
    expect(s).toEqual({ stage: "desafio", cleanStreak: 0, errorStreak: 0 });
  });
});
