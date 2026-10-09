import { describe, expect, it } from "vitest";
import * as E from "../../engine/viva/engine";
import {
  canAnswer,
  initialPlayerState,
  isBusy,
  isCorrectAnswer,
  playerReducer,
  shouldFireDone,
  type PlayerAction,
  type PlayerState,
} from "./playerReducer";

// push em pilha com 1 elemento: 5 passos, previsão revelada no passo 3.
const pushOp = () => E.stackPush([E.mk(1)], 2);
const PRED_STEP = 3;

const run = (s: PlayerState, ...actions: PlayerAction[]) =>
  actions.reduce(playerReducer, s);

const started = (autoPlay = false) =>
  run(initialPlayerState, { type: "START", op: pushOp(), autoPlay });

/** Avança até abrir a previsão do passo 3. */
const atQuestion = () => {
  let s = started();
  for (let i = 0; i < PRED_STEP; i++) s = run(s, { type: "NEXT" });
  return run(s, { type: "NEXT" });
};

const correctChoice = (s: PlayerState) => s.op!.steps[PRED_STEP].predict!.answer;
const wrongChoice = (s: PlayerState) => (correctChoice(s) + 1) % s.op!.steps[PRED_STEP].predict!.options.length;

describe("playerReducer", () => {
  it("START reinicia a operação e toca por padrão", () => {
    const s = run(initialPlayerState, { type: "START", op: pushOp() });
    expect(s.idx).toBe(0);
    expect(s.playing).toBe(true);
    expect(s.asking).toBeNull();
    expect(s.finished).toBe(false);
    expect(run(initialPlayerState, { type: "START", op: pushOp(), autoPlay: false }).playing).toBe(false);
  });

  it("NEXT avança um passo por vez", () => {
    const s = run(started(), { type: "NEXT" }, { type: "NEXT" });
    expect(s.idx).toBe(2);
  });

  it("NEXT abre a previsão antes de revelar o passo e pausa", () => {
    const s = run(started(true), { type: "NEXT" }, { type: "NEXT" }, { type: "NEXT" });
    expect(s.idx).toBe(2);
    const asked = run(s, { type: "NEXT" });
    expect(asked.asking).toBe(PRED_STEP);
    expect(asked.idx).toBe(2); // o passo da pergunta ainda não foi mostrado
    expect(asked.playing).toBe(false);
  });

  it("NEXT é ignorado enquanto há pergunta aberta", () => {
    const s = atQuestion();
    expect(run(s, { type: "NEXT" })).toBe(s);
  });

  it("sem modo previsão, a pergunta não abre", () => {
    let s = run(started(), { type: "SET_PREDICT_MODE", on: false });
    for (let i = 0; i < PRED_STEP; i++) s = run(s, { type: "NEXT" });
    expect(s.asking).toBeNull();
    expect(s.idx).toBe(PRED_STEP);
  });

  it("NEXT no último passo para a reprodução e não passa do fim", () => {
    let s = run(started(true), { type: "SKIP" });
    const last = s.op!.steps.length - 1;
    s = run({ ...s, playing: true }, { type: "NEXT" });
    expect(s.idx).toBe(last);
    expect(s.playing).toBe(false);
  });

  it("ANSWER certo soma acerto e total; errado soma só o total", () => {
    const q = atQuestion();
    const right = run(q, { type: "ANSWER", choice: correctChoice(q) });
    expect(right.score).toEqual({ ok: 1, total: 1 });
    const wrong = run(q, { type: "ANSWER", choice: wrongChoice(q) });
    expect(wrong.score).toEqual({ ok: 0, total: 1 });
    expect(wrong.answered[PRED_STEP]).toBe(wrongChoice(q));
  });

  it("segunda resposta à mesma pergunta é ignorada", () => {
    const q = atQuestion();
    const once = run(q, { type: "ANSWER", choice: wrongChoice(q) });
    expect(canAnswer(once)).toBe(false);
    const twice = run(once, { type: "ANSWER", choice: correctChoice(q) });
    expect(twice).toBe(once);
    expect(twice.score.total).toBe(1);
  });

  it("ANSWER sem pergunta aberta não faz nada", () => {
    const s = started();
    expect(canAnswer(s)).toBe(false);
    expect(run(s, { type: "ANSWER", choice: 0 })).toBe(s);
    expect(isCorrectAnswer(s, 0)).toBe(false);
  });

  it("CONTINUE revela o passo da pergunta e retoma a reprodução", () => {
    const q = atQuestion();
    const s = run(q, { type: "ANSWER", choice: correctChoice(q) }, { type: "CONTINUE" });
    expect(s.idx).toBe(PRED_STEP);
    expect(s.asking).toBeNull();
    expect(s.playing).toBe(true);
  });

  it("pergunta já respondida não é feita de novo ao voltar e avançar", () => {
    const q = atQuestion();
    let s = run(q, { type: "ANSWER", choice: correctChoice(q) }, { type: "CONTINUE" });
    s = run(s, { type: "PREV" }, { type: "NEXT" });
    expect(s.asking).toBeNull();
    expect(s.idx).toBe(PRED_STEP);
  });

  it("SKIP vai ao fim, fecha a pergunta e não pontua", () => {
    const s = run(atQuestion(), { type: "SKIP" });
    expect(s.idx).toBe(s.op!.steps.length - 1);
    expect(s.asking).toBeNull();
    expect(s.score).toEqual({ ok: 0, total: 0 });
  });

  it("PREV para a reprodução e nunca passa de 0", () => {
    const s = run({ ...started(true), idx: 1 }, { type: "PREV" }, { type: "PREV" });
    expect(s.idx).toBe(0);
    expect(s.playing).toBe(false);
  });

  it("RESTART volta ao início sem perder o placar", () => {
    const q = atQuestion();
    const s = run(q, { type: "ANSWER", choice: correctChoice(q) }, { type: "RESTART" });
    expect(s.idx).toBe(0);
    expect(s.asking).toBeNull();
    expect(s.score.total).toBe(1);
  });

  it("o placar sobrevive a uma nova operação, as respostas não", () => {
    const q = atQuestion();
    const answered = run(q, { type: "ANSWER", choice: correctChoice(q) });
    const again = run(answered, { type: "START", op: pushOp() });
    expect(again.score.total).toBe(1);
    expect(again.answered).toEqual({});
  });

  it("SET_SPEED e SET_PLAYING só mudam o próprio campo", () => {
    const s = run(started(), { type: "SET_SPEED", speed: 300 }, { type: "SET_PLAYING", playing: true });
    expect(s.speed).toBe(300);
    expect(s.playing).toBe(true);
    expect(s.idx).toBe(0);
  });
});

describe("fim da operação", () => {
  it("shouldFireDone só no último passo e uma única vez", () => {
    let s = started();
    expect(shouldFireDone(s)).toBe(false);
    s = run(s, { type: "SKIP" });
    expect(shouldFireDone(s)).toBe(true);
    s = run(s, { type: "DONE" });
    expect(shouldFireDone(s)).toBe(false);
    expect(s.finished).toBe(true);
    expect(s.playing).toBe(false);
  });

  it("busy: verdadeiro durante a operação, falso depois do fim (mesmo revisando)", () => {
    let s = started();
    expect(isBusy(s)).toBe(true);
    s = run(s, { type: "SKIP" }, { type: "DONE" });
    expect(isBusy(s)).toBe(false);
    s = run(s, { type: "PREV" });
    expect(isBusy(s)).toBe(false); // voltar passos é só revisão
    expect(shouldFireDone(run(s, { type: "SKIP" }))).toBe(false); // não notifica de novo
  });

  it("sem operação não há fim nem ocupação", () => {
    expect(shouldFireDone(initialPlayerState)).toBe(false);
    expect(isBusy(initialPlayerState)).toBe(false);
  });

  it("operação de um passo só (idle) dispara o fim logo ao iniciar", () => {
    const idle: E.Op = {
      name: "idle",
      structure: "stack",
      code: [],
      final: [],
      steps: [{ line: -1, nodes: [], pointers: {}, highlight: [], message: "", vars: {} }],
    };
    const s = run(initialPlayerState, { type: "START", op: idle });
    expect(shouldFireDone(s)).toBe(true);
  });
});
