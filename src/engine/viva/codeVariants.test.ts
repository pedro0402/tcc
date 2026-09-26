import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { CODE_LANGS, codeFor } from "./codeVariants";

// Cada operação executada de fato pela UI, com seu código canônico.
const OPS: { name: string; code: string[] }[] = [
  E.stackPush([E.mk(1)], 2),
  E.stackPop([E.mk(1)]),
  E.stackPeek([E.mk(1)]),
  E.stackIsEmpty([E.mk(1)]),
  E.listInsertHead([E.mk(1)], 2),
  E.listInsertTail([E.mk(1)], 2),
  E.listInsertAt([E.mk(1), E.mk(2)], 1, 9),
  E.listRemoveAt([E.mk(1), E.mk(2)], 1),
  E.listRemoveValue([E.mk(1), E.mk(2)], 2),
  E.listSearch([E.mk(1)], 1),
].map((op) => ({ name: op.name, code: op.code }));

describe("codeVariants — alinhamento com o motor", () => {
  for (const op of OPS) {
    for (const { id: lang } of CODE_LANGS) {
      it(`${op.name} em ${lang} tem o mesmo número de linhas do pseudocódigo`, () => {
        const lines = codeFor(op.name, lang, op.code);
        expect(lines.length).toBe(op.code.length);
      });
    }
  }

  it("operação desconhecida cai no pseudocódigo recebido", () => {
    const pseudo = ["a", "b"];
    expect(codeFor("inexistente", "java", pseudo)).toBe(pseudo);
  });
});
