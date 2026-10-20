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

// Todas as operações de lista nas três variantes, mais a pilha.
const ALL_OPS = [
  E.stackPush([E.mk(1)], 2),
  E.stackPop([E.mk(1)]),
  E.stackPeek([E.mk(1)]),
  E.stackIsEmpty([E.mk(1)]),
  ...(["simples", "dupla", "circular"] as ListKind[]).flatMap((kind) => {
    const L = listOps(kind);
    const l = () => [E.mk(1), E.mk(2)];
    return [L.insertHead(l(), 3), L.insertTail(l(), 3), L.insertAt(l(), 1, 3), L.removeAt(l(), 1), L.removeValue(l(), 2), L.search(l(), 2)];
  }),
];
const label = (op: E.Op) => `${op.name}${op.variant ? `@${op.variant}` : ""}`;

describe("codeVariants — o código exibido é executável", () => {
  it.each(ALL_OPS.map((op) => [label(op), op] as const))("Python de %s usa o estado do objeto (self)", (_l, op) => {
    const py = codeFor(op.name, "python", op.code, op.variant);
    expect(py[0]).toMatch(/^def \w+\(self\b/);
    // Atribuir topo/cabeca/cauda sem self. dentro da função dá UnboundLocalError.
    for (const line of py.slice(1)) {
      const code = line.replace(/#.*$/, "");
      expect(code, line).not.toMatch(/(^|[^\w.])(topo|cabeca|cauda|tamanho)\b/);
    }
  });

  it.each(ALL_OPS.map((op) => [label(op), op] as const))("C de %s não continua depois de erro()", (_l, op) => {
    for (const line of codeFor(op.name, "c", op.code, op.variant)) {
      if (line.includes("erro(")) expect(line, line).toMatch(/erro\([^)]*\);\s*return\b/);
    }
  });

  it("C libera todo nó removido", () => {
    for (const op of ALL_OPS.filter((o) => ["pop", "removerEm", "removerValor"].includes(o.name))) {
      // removerValor da circular delega para removerEm, que libera.
      if (op.name === "removerValor" && op.variant === "circular") continue;
      const c = codeFor(op.name, "c", op.code, op.variant).join("\n");
      expect(c, label(op)).toMatch(/free\(/);
    }
  });

  it("inserirEm e removerEm declaram a posição válida no cabeçalho, em todas as linguagens", () => {
    for (const op of ALL_OPS.filter((o) => o.name === "inserirEm" || o.name === "removerEm")) {
      for (const lang of ["js", "python", "java", "c"] as const) {
        const header = codeFor(op.name, lang, op.code, op.variant)[0];
        expect(header, `${label(op)} ${lang}`).toMatch(op.name === "inserirEm" ? /0 <= pos <= .*tamanho\(\)/ : /0 <= pos < .*tamanho\(\)/);
      }
      expect(op.code[0]).toMatch(/exige 0 <= pos/);
    }
  });

  it("a lista dupla não usa uma variável tamanho que ninguém atualiza", () => {
    const op = listOps("dupla").insertAt([E.mk(1)], 1, 2);
    for (const lang of ["js", "python", "java", "c"] as const) {
      const code = codeFor(op.name, lang, op.code, op.variant).join("\n");
      expect(code).not.toMatch(/tamanho(?!\()/);
    }
  });
});

describe("codeFor — alinhamento com o código recebido", () => {
  it("se o código do motor mudar de tamanho, mostra o código do motor", () => {
    const op = E.listInsertHead([E.mk(1)], 2);
    const changed = [...op.code, "  // linha nova"];
    expect(codeFor(op.name, "python", changed)).toBe(changed);
  });
});
