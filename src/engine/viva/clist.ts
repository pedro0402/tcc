// Lista circular simplesmente encadeada: só existe `cabeca`, e o último nó
// aponta de volta para ela. Nenhum `prox` é null (exceto no meio de uma
// operação), então os laços param quando voltam à cabeça, não em null.

import { ask, isIndex, mk } from "./engine";
import type { Node, Op, Predict, Step } from "./engine";
import { chain, insertSlot, listStep, patch } from "./links";
import type { Links } from "./links";

export const clistCode = {
  insertHead: [
    "inserirInicio(valor) {",
    "  novo = new No(valor)",
    "  if (cabeca == null) { cabeca = novo; novo.prox = novo; return }",
    "  ultimo = cabeca",
    "  while (ultimo.prox != cabeca)",
    "    ultimo = ultimo.prox",
    "  novo.prox = cabeca",
    "  ultimo.prox = novo",
    "  cabeca = novo",
    "}",
  ],
  insertTail: [
    "inserirFim(valor) {",
    "  novo = new No(valor)",
    "  if (cabeca == null) { cabeca = novo; novo.prox = novo; return }",
    "  ultimo = cabeca",
    "  while (ultimo.prox != cabeca)",
    "    ultimo = ultimo.prox",
    "  ultimo.prox = novo",
    "  novo.prox = cabeca",
    "}",
  ],
  insertAt: [
    "inserirEm(pos, valor) {",
    "  if (pos == 0) return inserirInicio(valor)",
    "  atual = cabeca",
    "  for (i = 0; i < pos - 1; i++)",
    "    atual = atual.prox",
    "  novo = new No(valor)",
    "  novo.prox = atual.prox",
    "  atual.prox = novo",
    "}",
  ],
  removeAt: [
    "removerEm(pos) {",
    "  if (cabeca.prox == cabeca) { cabeca = null; return }",
    "  if (pos == 0) {",
    "    ultimo = cabeca",
    "    while (ultimo.prox != cabeca)",
    "      ultimo = ultimo.prox",
    "    cabeca = cabeca.prox",
    "    ultimo.prox = cabeca",
    "    return",
    "  }",
    "  anterior = cabeca",
    "  for (i = 0; i < pos - 1; i++)",
    "    anterior = anterior.prox",
    "  anterior.prox = anterior.prox.prox",
    "}",
  ],
  removeValue: [
    "removerValor(valor) {",
    "  pos = buscar(valor)",
    "  if (pos == -1) return",
    "  removerEm(pos)",
    "}",
  ],
  search: [
    "buscar(valor) {",
    "  if (cabeca == null) return -1",
    "  atual = cabeca; i = 0",
    "  do {",
    "    if (atual.valor == valor) return i",
    "    atual = atual.prox; i++",
    "  } while (atual != cabeca)",
    "  return -1",
    "}",
  ],
};

const cOp = (name: string, code: string[], final: Node[], steps: Step[]): Op => ({
  name,
  structure: "linkedList",
  variant: "circular",
  code,
  final,
  steps,
});

const badPos = (pos: number, max: number) => !isIndex(pos) || pos < 0 || pos > max;
const posText = (pos: number) => (Number.isNaN(pos) ? "vazia" : `${pos}`);

const stopQuestion = (): Predict =>
  ask(
    "Numa lista circular nenhum prox é null. Quando o laço para?",
    "quando ultimo.prox volta a ser a cabeça",
    ["quando ultimo.prox é null", "quando ultimo é null", "quando i chega ao tamanho"],
  );

/**
 * Passos do laço "while (ultimo.prox != cabeca)": o último nó é o que aponta
 * de volta para a cabeça. `off` desloca os índices quando há um nó novo antes.
 */
function walkToLast(
  nodes: Node[],
  old: Node[],
  off: number,
  links: Links,
  lines: { check: number; advance: number },
  base: Record<string, number | null>,
  stop?: Predict,
): Step[] {
  const m = old.length;
  const s: Step[] = [];
  for (let k = 0; k < m - 1; k++) {
    s.push(listStep({
      line: lines.check, nodes, links, pointers: { ...base, ultimo: k + off }, highlight: [old[k].id],
      message: `ultimo.prox (${old[k + 1].value}) ≠ cabeca (${old[0].value}): continuamos.`,
      predict: k === 0 ? stop : undefined,
    }));
    s.push(listStep({
      line: lines.advance, nodes, links, pointers: { ...base, ultimo: k + 1 + off }, highlight: [old[k + 1].id],
      message: `ultimo avança para ${old[k + 1].value}.`,
    }));
  }
  s.push(listStep({
    line: lines.check, nodes, links, pointers: { ...base, ultimo: m - 1 + off }, highlight: [old[m - 1].id],
    message: `ultimo.prox é a cabeça (${old[0].value}): chegamos ao último nó.`,
    predict: m === 1 ? stop : undefined,
  }));
  return s;
}

/* --------------------------- inserirInicio --------------------------- */
export function cInsertHead(list: Node[], value: number): Op {
  const m = list.length;
  const n = mk(value);
  const nl = [n, ...list];
  const open = insertSlot(chain(m, "circular"), 0); // novo no índice 0, sem ligações
  const base = { cabeca: m ? 1 : null, novo: 0 };

  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "circular"), pointers: { cabeca: m ? 0 : null }, message: `inserirInicio(${value})`, vars: { valor: `${value}` } }),
    listStep({ line: 1, nodes: nl, links: open, pointers: base, highlight: [n.id], message: `Novo nó ${value} criado, ainda sem ligações.` }),
  ];
  if (!m) {
    s.push(listStep({
      line: 2, nodes: nl, links: patch(open, { prox: { 0: 0 } }), pointers: { cabeca: 0, novo: 0 }, highlight: [n.id],
      message: "Lista vazia: cabeca = novo e novo.prox aponta para o próprio nó.",
    }));
    return cOp("inserirInicio", clistCode.insertHead, nl, s);
  }

  s.push(listStep({ line: 2, nodes: nl, links: open, pointers: base, highlight: [n.id], message: "A lista não está vazia: seguimos.", vars: { "cabeca == null": "false" } }));
  s.push(listStep({ line: 3, nodes: nl, links: open, pointers: { ...base, ultimo: 1 }, highlight: [list[0].id], message: "ultimo começa na cabeça." }));
  s.push(...walkToLast(nl, list, 1, open, { check: 4, advance: 5 }, base, stopQuestion()));

  const l6 = patch(open, { prox: { 0: 1 } });
  s.push(listStep({
    line: 6, nodes: nl, links: l6, pointers: { ...base, ultimo: m }, highlight: [n.id],
    message: `novo.prox aponta para a cabeça atual (${list[0].value}).`, vars: { "novo.prox": `${list[0].value}` },
  }));
  s.push(listStep({
    line: 7, nodes: nl, links: patch(l6, { prox: { [m]: 0 } }), pointers: { ...base, ultimo: m }, highlight: [n.id],
    message: `O último nó (${list[m - 1].value}) passa a apontar para ${value}.`,
    predict: ask(
      "novo.prox já aponta para a cabeça. Qual ligação mantém a lista circular?",
      "ultimo.prox = novo",
      ["ultimo.prox = null", "cabeca.prox = novo", "novo.prox = null"],
    ),
  }));
  s.push(listStep({
    line: 8, nodes: nl, links: chain(m + 1, "circular"), pointers: { cabeca: 0 }, highlight: [n.id],
    message: `A cabeça agora é ${value}.`, vars: { cabeca: `${value}` },
  }));
  return cOp("inserirInicio", clistCode.insertHead, nl, s);
}

/* ---------------------------- inserirFim ----------------------------- */
export function cInsertTail(list: Node[], value: number): Op {
  const m = list.length;
  const n = mk(value);
  const nl = [...list, n];
  const open = insertSlot(chain(m, "circular"), m); // novo no fim, sem ligações
  const base = { cabeca: m ? 0 : null, novo: m };

  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "circular"), pointers: { cabeca: m ? 0 : null }, message: `inserirFim(${value})`, vars: { valor: `${value}` } }),
    listStep({ line: 1, nodes: nl, links: open, pointers: base, highlight: [n.id], message: `Novo nó ${value} criado, ainda sem ligações.` }),
  ];
  if (!m) {
    s.push(listStep({
      line: 2, nodes: nl, links: patch(open, { prox: { 0: 0 } }), pointers: { cabeca: 0, novo: 0 }, highlight: [n.id],
      message: "Lista vazia: cabeca = novo e novo.prox aponta para o próprio nó.",
    }));
    return cOp("inserirFim", clistCode.insertTail, nl, s);
  }

  s.push(listStep({ line: 2, nodes: nl, links: open, pointers: base, highlight: [n.id], message: "A lista não está vazia: seguimos.", vars: { "cabeca == null": "false" } }));
  s.push(listStep({ line: 3, nodes: nl, links: open, pointers: { ...base, ultimo: 0 }, highlight: [list[0].id], message: "ultimo começa na cabeça." }));
  s.push(...walkToLast(nl, list, 0, open, { check: 4, advance: 5 }, base, stopQuestion()));

  const l6 = patch(open, { prox: { [m - 1]: m } });
  s.push(listStep({
    line: 6, nodes: nl, links: l6, pointers: { ...base, ultimo: m - 1 }, highlight: [n.id],
    message: `O último nó (${list[m - 1].value}) passa a apontar para ${value}. O novo nó ainda não volta à cabeça.`,
  }));
  s.push(listStep({
    line: 7, nodes: nl, links: patch(l6, { prox: { [m]: 0 } }), pointers: { ...base, ultimo: m - 1 }, highlight: [n.id],
    message: `novo.prox aponta para a cabeça (${list[0].value}): o círculo se fecha.`,
    predict: ask(
      "O novo nó ainda não aponta para ninguém. Como fechamos o círculo?",
      "novo.prox = cabeca",
      ["novo.prox = null", "cabeca = novo", "ultimo.prox = cabeca"],
    ),
  }));
  return cOp("inserirFim", clistCode.insertTail, nl, s);
}

/* ----------------------------- inserirEm ----------------------------- */
export function cInsertAt(list: Node[], pos: number, value: number): Op {
  const code = clistCode.insertAt;
  const m = list.length;
  if (badPos(pos, m)) {
    return cOp("inserirEm", code, list, [
      listStep({ line: 0, nodes: list, links: chain(m, "circular"), pointers: { cabeca: m ? 0 : null }, message: `Posição ${posText(pos)} inválida (0 a ${m}).`, error: true }),
    ]);
  }
  if (pos === 0) {
    const r = cInsertHead(list, value);
    return cOp("inserirEm", code, r.final, [
      listStep({ line: 1, nodes: list, links: chain(m, "circular"), pointers: { cabeca: m ? 0 : null }, message: "pos == 0: inserção no início.", vars: { pos: "0" } }),
      ...r.steps.slice(1).map((x) => ({ ...x, line: 1 })),
    ]);
  }

  const a = pos - 1; // índice de `atual`
  const n = mk(value);
  const withN = [...list.slice(0, pos), n, ...list.slice(pos)];
  const open = insertSlot(chain(m, "circular"), pos);
  const ptr = (extra: Record<string, number | null> = {}) => ({ cabeca: 0, atual: a, novo: pos, ...extra });
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "circular"), pointers: { cabeca: 0 }, message: `inserirEm(${pos}, ${value})`, vars: { pos: `${pos}` } }),
    listStep({ line: 2, nodes: list, links: chain(m, "circular"), pointers: { cabeca: 0, atual: 0 }, highlight: [list[0].id], message: "atual começa na cabeça." }),
  ];
  for (let i = 0; i < pos - 1; i++) {
    s.push(listStep({ line: 4, nodes: list, links: chain(m, "circular"), pointers: { cabeca: 0, atual: i + 1 }, highlight: [list[i + 1].id], message: `atual avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } }));
  }
  s.push(listStep({ line: 5, nodes: withN, links: open, pointers: ptr(), highlight: [n.id], message: `atual está na posição ${a}. Criamos o nó ${value}, ainda sem ligações.` }));

  const wraps = pos === m; // atual é o último: atual.prox é a cabeça
  const next = wraps ? 0 : pos + 1;
  const l6 = patch(open, { prox: { [pos]: next } });
  s.push(listStep({
    line: 6, nodes: withN, links: l6, pointers: ptr(), highlight: [n.id],
    message: wraps
      ? `atual é o último: atual.prox é a cabeça (${list[0].value}), então novo.prox também aponta para ela.`
      : `novo.prox aponta para ${list[pos].value} (evita perder o resto da lista).`,
    predict: ask(
      "Qual ligação deve ser feita primeiro?",
      "novo.prox = atual.prox",
      ["atual.prox = novo", "cabeca = novo", "atual = null"],
    ),
  }));
  s.push(listStep({
    line: 7, nodes: withN, links: chain(m + 1, "circular"), pointers: { cabeca: 0 }, highlight: [n.id],
    message: `atual.prox aponta para ${value}. Inserção concluída.`,
  }));
  return cOp("inserirEm", code, withN, s);
}

/* ----------------------------- removerEm ----------------------------- */
export function cRemoveAt(list: Node[], pos: number): Op {
  const code = clistCode.removeAt;
  const m = list.length;
  if (badPos(pos, m - 1)) {
    return cOp("removerEm", code, list, [
      listStep({
        line: 0, nodes: list, links: chain(m, "circular"), pointers: { cabeca: m ? 0 : null }, error: true,
        message: m ? `Posição ${posText(pos)} inválida (0 a ${m - 1}).` : "Lista vazia: nada a remover.",
      }),
    ]);
  }
  const c = chain(m, "circular");
  const rest = list.filter((_, i) => i !== pos);
  const t = list[pos];
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: c, pointers: { cabeca: 0 }, message: `removerEm(${pos})`, vars: { pos: `${pos}` } }),
  ];

  if (m === 1) {
    s.push(
      listStep({ line: 1, nodes: list, links: c, pointers: { cabeca: 0 }, removing: t.id, message: "O único nó aponta para si mesmo: a lista vai ficar vazia.", vars: { "cabeca.prox == cabeca": "true" } }),
      listStep({ line: 1, nodes: [], links: chain(0, "circular"), pointers: { cabeca: null }, message: `Nó ${t.value} removido.` }),
    );
    return cOp("removerEm", code, rest, s);
  }

  s.push(listStep({ line: 1, nodes: list, links: c, pointers: { cabeca: 0 }, message: "cabeca.prox ≠ cabeca: há mais de um nó.", vars: { "cabeca.prox == cabeca": "false" } }));

  if (pos === 0) {
    s.push(listStep({ line: 2, nodes: list, links: c, pointers: { cabeca: 0 }, highlight: [t.id], message: "pos == 0: vamos remover a cabeça." }));
    s.push(listStep({ line: 3, nodes: list, links: c, pointers: { cabeca: 0, ultimo: 0 }, highlight: [list[0].id], message: "ultimo começa na cabeça." }));
    s.push(...walkToLast(list, list, 0, c, { check: 4, advance: 5 }, { cabeca: 0 }));
    s.push(listStep({
      line: 6, nodes: list, links: c, pointers: { cabeca: 1, ultimo: m - 1 }, removing: t.id,
      message: `cabeca avança para ${list[1].value}. O último nó ainda aponta para o nó removido!`,
    }));
    s.push(listStep({
      line: 7, nodes: list, links: patch(c, { prox: { [m - 1]: 1 } }), pointers: { cabeca: 1, ultimo: m - 1 }, removing: t.id,
      message: `ultimo.prox passa a apontar para a nova cabeça (${list[1].value}).`,
      predict: ask(
        "A cabeça avançou, mas o último nó ainda aponta para o nó removido. O que falta?",
        "ultimo.prox passa a apontar para a nova cabeça",
        ["nada, a lista já está correta", "novo.prox = null", "cabeca = ultimo"],
      ),
    }));
    s.push(listStep({ line: 8, nodes: rest, links: chain(m - 1, "circular"), pointers: { cabeca: 0 }, message: `Nó ${t.value} removido.` }));
    return cOp("removerEm", code, rest, s);
  }

  s.push(listStep({ line: 2, nodes: list, links: c, pointers: { cabeca: 0 }, message: "pos ≠ 0: percorremos até o anterior." }));
  s.push(listStep({ line: 10, nodes: list, links: c, pointers: { cabeca: 0, anterior: 0 }, highlight: [list[0].id], message: "anterior começa na cabeça." }));
  for (let i = 0; i < pos - 1; i++) {
    s.push(listStep({ line: 12, nodes: list, links: c, pointers: { cabeca: 0, anterior: i + 1 }, highlight: [list[i + 1].id], message: `anterior avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } }));
  }
  const wraps = pos === m - 1;
  s.push(listStep({
    line: 13, nodes: list, links: patch(c, { prox: { [pos - 1]: wraps ? 0 : pos + 1 } }),
    pointers: { cabeca: 0, anterior: pos - 1, alvo: pos }, removing: t.id,
    message: wraps
      ? `anterior pula o alvo e volta a apontar para a cabeça (${list[0].value}): o círculo se fecha.`
      : `anterior pula o alvo e aponta para ${list[pos + 1].value}.`,
    predict: ask(
      "Como desligamos o alvo?",
      "anterior.prox = anterior.prox.prox",
      ["alvo.prox = null apenas", "cabeca = alvo", "anterior = alvo"],
    ),
  }));
  s.push(listStep({ line: 13, nodes: rest, links: chain(m - 1, "circular"), pointers: { cabeca: 0 }, message: `Nó ${t.value} removido.` }));
  return cOp("removerEm", code, rest, s);
}

/* ---------------------------- removerValor ---------------------------- */
export function cRemoveValue(list: Node[], value: number): Op {
  const code = clistCode.removeValue;
  const m = list.length;
  const c = chain(m, "circular");
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: c, pointers: { cabeca: m ? 0 : null }, message: `removerValor(${value})`, vars: { valor: `${value}` } }),
  ];
  if (!m) {
    s.push(
      listStep({ line: 1, nodes: list, links: c, pointers: { cabeca: null }, message: "Lista vazia: buscar devolve -1.", vars: { pos: "-1" } }),
      listStep({ line: 2, nodes: list, links: c, pointers: { cabeca: null }, message: "pos == -1: nada a remover.", error: true }),
    );
    return cOp("removerValor", code, list, s);
  }
  const hit = list.findIndex((x) => x.value === value);
  const last = hit >= 0 ? hit : m - 1;
  for (let k = 0; k <= last; k++) {
    s.push(listStep({
      line: 1, nodes: list, links: c, pointers: { cabeca: 0, atual: k }, highlight: [list[k].id],
      message: k === hit ? `buscar: atual = ${list[k].value}, é o valor!` : `buscar: atual = ${list[k].value} ≠ ${value}.`,
    }));
  }
  if (hit < 0) {
    s.push(listStep({
      line: 2, nodes: list, links: c, pointers: { cabeca: 0 }, error: true,
      message: `pos == -1: ${value} não está na lista. Nada muda.`, vars: { pos: "-1" },
    }));
    return cOp("removerValor", code, list, s);
  }
  s.push(listStep({ line: 2, nodes: list, links: c, pointers: { cabeca: 0, atual: hit }, highlight: [list[hit].id], message: `pos = ${hit}: o valor foi encontrado.`, vars: { pos: `${hit}` } }));
  const r = cRemoveAt(list, hit);
  s.push(...r.steps.slice(1).map((x) => ({ ...x, line: 3 })));
  return cOp("removerValor", code, r.final, s);
}

/* ------------------------------- buscar ------------------------------- */
export function cSearch(list: Node[], value: number): Op {
  const code = clistCode.search;
  const m = list.length;
  const c = chain(m, "circular");
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: c, pointers: { cabeca: m ? 0 : null }, message: `buscar(${value})` }),
  ];
  if (!m) {
    s.push(listStep({ line: 1, nodes: list, links: c, pointers: { cabeca: null }, message: "Lista vazia: devolve -1.", vars: { retorno: "-1" }, error: true }));
    return cOp("buscar", code, list, s);
  }
  s.push(listStep({ line: 1, nodes: list, links: c, pointers: { cabeca: 0 }, message: "A lista não está vazia.", vars: { "cabeca == null": "false" } }));
  s.push(listStep({ line: 2, nodes: list, links: c, pointers: { cabeca: 0, atual: 0 }, highlight: [list[0].id], message: "atual começa na cabeça, i = 0.", vars: { i: "0", atual: `${list[0].value}` } }));

  for (let i = 0; i < m; i++) {
    const hit = list[i].value === value;
    s.push(listStep({
      line: 4, nodes: list, links: c, pointers: { cabeca: 0, atual: i }, highlight: [list[i].id],
      message: hit ? `Encontrado na posição ${i}!` : `${list[i].value} ≠ ${value}.`, vars: { retorno: hit ? `${i}` : "-" },
    }));
    if (hit) return cOp("buscar", code, list, s);

    const nxt = (i + 1) % m;
    const wrapped = i + 1 === m;
    s.push(listStep({
      line: 5, nodes: list, links: c, pointers: { cabeca: 0, atual: nxt }, highlight: [list[nxt].id], message: "Avançamos.", vars: { i: `${i + 1}` },
      predict: i === 0 && m > 1
        ? ask(`${list[i].value} é diferente de ${value}. E agora?`, "atual avança para o próximo nó", ["Retorna -1", "Retorna 0", "Remove o nó"])
        : undefined,
    }));
    s.push(listStep({
      line: 6, nodes: list, links: c, pointers: { cabeca: 0, atual: nxt }, highlight: [list[nxt].id],
      message: wrapped
        ? `atual voltou à cabeça (${list[0].value}): percorremos o círculo todo.`
        : `atual (${list[nxt].value}) ≠ cabeca: repetimos.`,
      vars: { "atual != cabeca": `${!wrapped}` },
      predict: wrapped
        ? ask(
            "atual voltou à cabeça. O que acontece com o laço?",
            "O laço termina: já percorremos todo o círculo",
            ["O laço continua girando", "Retorna 0", "atual vira null"],
          )
        : undefined,
    }));
  }
  s.push(listStep({ line: 7, nodes: list, links: c, pointers: { cabeca: 0 }, message: `${value} não está na lista. Retorna -1.`, vars: { retorno: "-1" }, error: true }));
  return cOp("buscar", code, list, s);
}
