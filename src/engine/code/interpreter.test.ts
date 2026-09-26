import { describe, expect, it } from "vitest";
import { interpretCode } from "./interpreter";
import { CODE_LANGS, snippetFor, type CodeLang, type CodeOp } from "./languages";

const STACK_SEED = [3, 8, 1];
const LIST_SEED = [2, 5, 9];

function run(
  lang: CodeLang,
  op: CodeOp,
  seed: number[],
  structure: "stack" | "linkedList",
  value = 7
) {
  return interpretCode({
    code: snippetFor(lang, op, value),
    lang,
    structure,
    seed,
    fallbackOp: op,
    fallbackValue: value,
  });
}

describe("interpretCode — snippets padrão", () => {
  for (const { id: lang } of CODE_LANGS) {
    it(`push em ${lang} empilha 7 no topo`, () => {
      const result = run(lang, "push", STACK_SEED, "stack");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.values).toEqual([3, 8, 1, 7]);
    });

    it(`pop em ${lang} remove o topo`, () => {
      const result = run(lang, "pop", STACK_SEED, "stack");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.values).toEqual([3, 8]);
    });

    it(`insertAtHead em ${lang} coloca 7 no início`, () => {
      const result = run(lang, "insertAtHead", LIST_SEED, "linkedList");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.values).toEqual([7, 2, 5, 9]);
    });

    it(`insertAtTail em ${lang} coloca 7 no fim`, () => {
      const result = run(lang, "insertAtTail", LIST_SEED, "linkedList");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.values).toEqual([2, 5, 9, 7]);
    });

    it(`remove em ${lang} tira o 5`, () => {
      const result = run(lang, "remove", LIST_SEED, "linkedList", 5);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.values).toEqual([2, 9]);
    });
  }
});

describe("interpretCode — edição ao vivo", () => {
  it("alterar o índice da atribuição muda outro elemento da pilha", () => {
    const result = interpretCode({
      code: `function push(value) {
  pilha[0] = value;
}
push(7);`,
      lang: "js",
      structure: "stack",
      seed: STACK_SEED,
      fallbackOp: "push",
      fallbackValue: 7,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values).toEqual([7, 8, 1]);
  });

  it("várias chamadas empilham em sequência", () => {
    const result = interpretCode({
      code: `function push(value) {
  pilha.append(value);
}
push(4);
push(6);`,
      lang: "js",
      structure: "stack",
      seed: STACK_SEED,
      fallbackOp: "push",
      fallbackValue: 7,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values).toEqual([3, 8, 1, 4, 6]);
  });

  it("código incompleto devolve erro sem quebrar", () => {
    const result = interpretCode({
      code: "function push(value) {",
      lang: "js",
      structure: "stack",
      seed: STACK_SEED,
      fallbackOp: "push",
      fallbackValue: 7,
    });
    expect(result.ok).toBe(false);
  });
});
