import { describe, expect, it } from "vitest";
import { afterStep, formatSeconds, startDesafio, stepsLeft, tick } from "./desafioState";

describe("desafio", () => {
  it("começa rodando com tempo e passos cheios", () => {
    const s = startDesafio([1, 2], 6, 60);
    expect(s.status).toBe("running");
    expect(stepsLeft(s)).toBe(6);
    expect(s.secondsLeft).toBe(60);
  });

  it("vence ao bater a meta", () => {
    let s = startDesafio([1, 2], 6, 60);
    s = afterStep(s, [1]);
    expect(s.status).toBe("running");
    expect(stepsLeft(s)).toBe(5);
    s = afterStep(s, [1, 2]);
    expect(s.status).toBe("won");
  });

  it("falha ao esgotar os passos sem a meta", () => {
    let s = startDesafio([9], 2, 60);
    s = afterStep(s, [1]);
    expect(s.status).toBe("running");
    s = afterStep(s, [1, 2]);
    expect(s.status).toBe("failed");
  });

  it("depois de vencer ou falhar, novas ações não mudam o status", () => {
    let s = startDesafio([1], 3, 60);
    s = afterStep(s, [1]); // won
    expect(s.status).toBe("won");
    expect(afterStep(s, [9]).status).toBe("won");
    expect(tick(s).status).toBe("won");
  });

  it("o relógio regressivo falha ao zerar", () => {
    let s = startDesafio([1], 3, 2);
    s = tick(s);
    expect(s.secondsLeft).toBe(1);
    expect(s.status).toBe("running");
    s = tick(s);
    expect(s.secondsLeft).toBe(0);
    expect(s.status).toBe("failed");
  });

  it("vencer no último passo permitido não é falha", () => {
    let s = startDesafio([1, 2], 2, 60);
    s = afterStep(s, [1]);
    s = afterStep(s, [1, 2]); // 2º e último passo, mas bateu a meta
    expect(s.status).toBe("won");
  });

  it("formatSeconds mostra mm:ss", () => {
    expect(formatSeconds(60)).toBe("1:00");
    expect(formatSeconds(9)).toBe("0:09");
    expect(formatSeconds(125)).toBe("2:05");
  });
});
