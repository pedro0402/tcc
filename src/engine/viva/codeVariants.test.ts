import { describe, expect, it } from "vitest";
import * as E from "./engine";
import { CODE_LANGS, codeFor } from "./codeVariants";
import type { ListKind } from "./links";
import { listOps } from "./lists";

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

// Listas dupla e circular: o código mostrado precisa ser o da variante, linha a linha.
const VARIANTS: ListKind[] = ["dupla", "circular"];

describe.each(VARIANTS)("codeVariants — lista %s", (kind) => {
  const L = listOps(kind);
  const sample = () => [E.mk(1), E.mk(2), E.mk(3)];
  const ops = [
    L.insertHead(sample(), 9),
    L.insertTail(sample(), 9),
    L.insertAt(sample(), 1, 9),
    L.removeAt(sample(), 1),
    L.removeValue(sample(), 2),
    L.search(sample(), 2),
  ];

  for (const op of ops) {
    for (const { id: lang } of CODE_LANGS) {
      it(`${op.name} em ${lang}: mesmo número de linhas e não cai no pseudocódigo`, () => {
        const lines = codeFor(op.name, lang, op.code, kind);
        expect(lines.length).toBe(op.code.length);
        // Se a chave "nome@variante" faltasse, codeFor devolveria o próprio pseudocódigo.
        expect(lines).not.toBe(op.code);
      });
    }
  }

  it("todo passo aponta para uma linha que existe no código de cada linguagem", () => {
    for (const op of ops) {
      for (const { id: lang } of CODE_LANGS) {
        const lines = codeFor(op.name, lang, op.code, kind);
        for (const st of op.steps) expect(st.line).toBeLessThan(lines.length);
      }
    }
  });
});

describe("codeVariants — a variante muda o código", () => {
  const sample = () => [E.mk(1), E.mk(2)];
  const head = E.listInsertHead(sample(), 5);

  it("inserirInicio da dupla menciona ant; o da simples não", () => {
    const dupla = listOps("dupla").insertHead(sample(), 5);
    const circ = listOps("circular").insertHead(sample(), 5);
    expect(codeFor("inserirInicio", "js", dupla.code, "dupla").join("\n")).toContain("cabeca.ant = novo");
    expect(codeFor("inserirInicio", "js", head.code).join("\n")).not.toContain(".ant");
    expect(codeFor("inserirInicio", "js", circ.code, "circular").join("\n")).toContain("ultimo.prox != cabeca");
  });

  it("a busca da lista circular para ao voltar à cabeça", () => {
    const op = listOps("circular").search(sample(), 7);
    expect(codeFor("buscar", "java", op.code, "circular").join("\n")).toContain("atual != cabeca");
  });

  it("sem variante, o código é o da lista simples", () => {
    expect(codeFor("inserirFim", "js", head.code)).toEqual(codeFor("inserirFim", "js", head.code, "simples"));
  });
});
