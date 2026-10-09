// Lista duplamente encadeada: cada nó guarda `prox` e `ant`, e a lista mantém
// `cabeca` e `cauda`. Os passos mostram os estados intermediários em que um nó
// está ligado só num sentido, que é onde mais se erra nessa estrutura.

import { ask, isIndex, mk, valOrNull } from "./engine";
import type { Node, Op, Step } from "./engine";
import { chain, insertSlot, listStep, patch } from "./links";

export const dlistCode = {
  insertHead: [
    "inserirInicio(valor) {",
    "  novo = new No(valor)",
    "  novo.prox = cabeca",
    "  if (cabeca != null) cabeca.ant = novo",
    "  else cauda = novo",
    "  cabeca = novo",
    "}",
  ],
  insertTail: [
    "inserirFim(valor) {",
    "  novo = new No(valor)",
    "  novo.ant = cauda",
    "  if (cauda != null) cauda.prox = novo",
    "  else cabeca = novo",
    "  cauda = novo",
    "}",
  ],
  insertAt: [
    "inserirEm(pos, valor) {",
    "  if (pos == 0) return inserirInicio(valor)",
    "  if (pos == tamanho) return inserirFim(valor)",
    "  atual = cabeca",
    "  for (i = 0; i < pos - 1; i++) atual = atual.prox",
    "  novo = new No(valor)",
    "  novo.prox = atual.prox",
    "  novo.ant = atual",
    "  atual.prox.ant = novo",
    "  atual.prox = novo",
    "}",
  ],
  removeAt: [
    "removerEm(pos) {",
    "  alvo = cabeca",
    "  for (i = 0; i < pos; i++) alvo = alvo.prox",
    "  if (alvo.ant != null) alvo.ant.prox = alvo.prox",
    "  else cabeca = alvo.prox",
    "  if (alvo.prox != null) alvo.prox.ant = alvo.ant",
    "  else cauda = alvo.ant",
    "}",
  ],
  removeValue: [
    "removerValor(valor) {",
    "  alvo = cabeca",
    "  while (alvo != null && alvo.valor != valor)",
    "    alvo = alvo.prox",
    "  if (alvo == null) return",
    "  if (alvo.ant != null) alvo.ant.prox = alvo.prox",
    "  else cabeca = alvo.prox",
    "  if (alvo.prox != null) alvo.prox.ant = alvo.ant",
    "  else cauda = alvo.ant",
    "}",
  ],
  // A busca percorre a lista da cabeça para a cauda, igual à da lista simples.
  search: [
    "buscar(valor) {",
    "  atual = cabeca; i = 0",
    "  while (atual != null) {",
    "    if (atual.valor == valor) return i",
    "    atual = atual.prox; i++",
    "  }",
    "  return -1",
    "}",
  ],
};

const dOp = (name: string, code: string[], final: Node[], steps: Step[]): Op => ({
  name,
  structure: "linkedList",
  variant: "dupla",
  code,
  final,
  steps,
});

/** Ponteiros de extremidade para uma lista de `n` nós. */
const ends = (n: number, extra: Record<string, number | null> = {}) => ({
  cabeca: n ? 0 : null,
  cauda: n ? n - 1 : null,
  ...extra,
});

const badPos = (pos: number, max: number) => !isIndex(pos) || pos < 0 || pos > max;
const posText = (pos: number) => (Number.isNaN(pos) ? "vazia" : `${pos}`);

/* --------------------------- inserirInicio --------------------------- */
export function dInsertHead(list: Node[], value: number): Op {
  const m = list.length;
  const n = mk(value);
  const nl = [n, ...list];
  const open = insertSlot(chain(m, "dupla"), 0); // novo no índice 0, sem ligações
  const at = (extra: Record<string, number | null>) => ({
    cabeca: m ? 1 : null,
    cauda: m ? m : null,
    ...extra,
  });

  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `inserirInicio(${value})`, vars: { valor: `${value}` } }),
    listStep({ line: 1, nodes: nl, links: open, pointers: at({ novo: 0 }), highlight: [n.id], message: `Novo nó ${value} criado, ainda sem ligações.` }),
  ];
  const withProx = patch(open, { prox: { 0: m ? 1 : null } });
  s.push(
    listStep({
      line: 2, nodes: nl, links: withProx, pointers: at({ novo: 0 }), highlight: [n.id],
      message: `novo.prox aponta para a cabeça atual (${valOrNull(list[0])}).`,
      vars: { "novo.prox": valOrNull(list[0]) },
    }),
  );

  if (m) {
    s.push(
      listStep({
        line: 3, nodes: nl, links: patch(withProx, { ant: { 1: 0 } }), pointers: at({ novo: 0 }), highlight: [n.id],
        message: `A cabeça antiga (${list[0].value}) passa a apontar de volta (ant) para ${value}.`,
        predict: ask(
          "novo.prox já aponta para a cabeça. Qual é o próximo passo?",
          "cabeca.ant = novo",
          [
            { text: "cabeca = novo", misconception: "ordem-religacao-insercao" },
            { text: "cauda = novo", misconception: "no-vs-ponteiro" },
            { text: "novo.ant = cabeca", misconception: "dupla-um-lado" },
          ],
          { id: "dlist.insertHead.ant", concept: "dupla.ant", explain: "Numa lista dupla toda ligação tem volta: a cabeça antiga precisa apontar de volta (ant) para o novo nó antes de a cabeça mudar." },
        ),
      }),
    );
  } else {
    s.push(
      listStep({ line: 3, nodes: nl, links: withProx, pointers: at({ novo: 0 }), highlight: [n.id], message: "cabeca é null: não há nó para ligar de volta.", vars: { "cabeca == null": "true" } }),
      listStep({ line: 4, nodes: nl, links: withProx, pointers: { cabeca: null, cauda: 0, novo: 0 }, highlight: [n.id], message: "Lista vazia: o novo nó também é a cauda." }),
    );
  }
  s.push(
    listStep({
      line: 5, nodes: nl, links: chain(m + 1, "dupla"), pointers: { cabeca: 0, cauda: m }, highlight: [n.id],
      message: `A cabeça agora é ${value}.`, vars: { cabeca: `${value}` },
    }),
  );
  return dOp("inserirInicio", dlistCode.insertHead, nl, s);
}

/* ---------------------------- inserirFim ----------------------------- */
export function dInsertTail(list: Node[], value: number): Op {
  const m = list.length;
  const n = mk(value);
  const nl = [...list, n];
  const open = insertSlot(chain(m, "dupla"), m); // novo no fim, sem ligações
  const at = (extra: Record<string, number | null>) => ({
    cabeca: m ? 0 : null,
    cauda: m ? m - 1 : null,
    ...extra,
  });

  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `inserirFim(${value})`, vars: { valor: `${value}` } }),
    listStep({ line: 1, nodes: nl, links: open, pointers: at({ novo: m }), highlight: [n.id], message: `Novo nó ${value} criado, ainda sem ligações.` }),
  ];
  const withAnt = patch(open, { ant: { [m]: m ? m - 1 : null } });
  s.push(
    listStep({
      line: 2, nodes: nl, links: withAnt, pointers: at({ novo: m }), highlight: [n.id],
      message: `novo.ant aponta para a cauda atual (${valOrNull(list[m - 1])}).`,
      vars: { "novo.ant": valOrNull(list[m - 1]) },
    }),
  );

  if (m) {
    s.push(
      listStep({
        line: 3, nodes: nl, links: patch(withAnt, { prox: { [m - 1]: m } }), pointers: at({ novo: m }), highlight: [n.id],
        message: `A cauda antiga (${list[m - 1].value}) passa a apontar para ${value}.`,
        predict: ask(
          "novo.ant já aponta para a cauda. O que liga a cauda ao novo nó?",
          "cauda.prox = novo",
          [
            { text: "cauda = novo", misconception: "no-vs-ponteiro" },
            { text: "novo.prox = cauda", misconception: "dupla-um-lado" },
            "percorrer a lista até o fim",
          ],
          { id: "dlist.insertTail.prox", concept: "dupla.ant", explain: "A cauda guarda o último nó, então não é preciso percorrer: a cauda aponta para o novo, que já aponta de volta para ela." },
        ),
      }),
    );
  } else {
    s.push(
      listStep({ line: 3, nodes: nl, links: withAnt, pointers: at({ novo: m }), highlight: [n.id], message: "cauda é null: não há nó para ligar.", vars: { "cauda == null": "true" } }),
      listStep({ line: 4, nodes: nl, links: withAnt, pointers: { cabeca: 0, cauda: null, novo: 0 }, highlight: [n.id], message: "Lista vazia: o novo nó também é a cabeça." }),
    );
  }
  s.push(
    listStep({
      line: 5, nodes: nl, links: chain(m + 1, "dupla"), pointers: { cabeca: 0, cauda: m }, highlight: [n.id],
      message: `A cauda agora é ${value}. Sem percorrer a lista!`, vars: { cauda: `${value}` },
    }),
  );
  return dOp("inserirFim", dlistCode.insertTail, nl, s);
}

/* ----------------------------- inserirEm ----------------------------- */
export function dInsertAt(list: Node[], pos: number, value: number): Op {
  const code = dlistCode.insertAt;
  const m = list.length;
  if (badPos(pos, m)) {
    return dOp("inserirEm", code, list, [
      listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `Posição ${posText(pos)} inválida (0 a ${m}).`, error: true }),
    ]);
  }
  if (pos === 0) {
    const r = dInsertHead(list, value);
    return dOp("inserirEm", code, r.final, [
      listStep({ line: 1, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: "pos == 0: inserção no início.", vars: { pos: "0" } }),
      ...r.steps.slice(1).map((x) => ({ ...x, line: 1 })),
    ]);
  }
  if (pos === m) {
    const r = dInsertTail(list, value);
    return dOp("inserirEm", code, r.final, [
      listStep({ line: 2, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: "pos == tamanho: inserção no fim.", vars: { pos: `${pos}` } }),
      ...r.steps.slice(1).map((x) => ({ ...x, line: 2 })),
    ]);
  }

  const a = pos - 1; // índice de `atual`
  const n = mk(value);
  const withN = [...list.slice(0, pos), n, ...list.slice(pos)];
  const open = insertSlot(chain(m, "dupla"), pos);
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `inserirEm(${pos}, ${value})`, vars: { pos: `${pos}` } }),
    listStep({ line: 3, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { atual: 0 }), highlight: [list[0].id], message: "atual começa na cabeça." }),
  ];
  for (let i = 0; i < pos - 1; i++) {
    s.push(listStep({ line: 4, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { atual: i + 1 }), highlight: [list[i + 1].id], message: `atual avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } }));
  }
  const ptr = (extra: Record<string, number | null> = {}) => ({ cabeca: 0, cauda: m, atual: a, novo: pos, ...extra });

  s.push(listStep({ line: 5, nodes: withN, links: open, pointers: ptr(), highlight: [n.id], message: `atual está na posição ${a}. Criamos o nó ${value}, ainda sem ligações.` }));
  const l6 = patch(open, { prox: { [pos]: pos + 1 } });
  s.push(listStep({ line: 6, nodes: withN, links: l6, pointers: ptr(), highlight: [n.id], message: `novo.prox aponta para ${list[pos].value}, o vizinho da direita.`, vars: { "novo.prox": `${list[pos].value}` } }));
  const l7 = patch(l6, { ant: { [pos]: a } });
  s.push(listStep({ line: 7, nodes: withN, links: l7, pointers: ptr(), highlight: [n.id], message: `novo.ant aponta para atual (${list[a].value}).`, vars: { "novo.ant": `${list[a].value}` } }));
  const l8 = patch(l7, { ant: { [pos + 1]: pos } });
  s.push(
    listStep({
      line: 8, nodes: withN, links: l8, pointers: ptr(), highlight: [n.id],
      message: `O vizinho da direita (${list[pos].value}) passa a apontar de volta para ${value}.`,
      predict: ask(
        "novo aponta para os dois vizinhos, mas eles ainda não apontam para novo. Qual ligação vem primeiro?",
        "atual.prox.ant = novo",
        [
          { text: "atual.prox = novo", misconception: "ordem-religacao-insercao" },
          { text: "cabeca.ant = novo", misconception: "no-vs-ponteiro" },
          { text: "novo.prox = null", misconception: "null-significado" },
        ],
        { id: "dlist.insertAt.ant", concept: "dupla.ant", explain: "O vizinho da direita precisa apontar de volta (ant) para o novo nó antes de atual.prox mudar; senão a volta da lista fica errada." },
      ),
    }),
  );
  s.push(listStep({ line: 9, nodes: withN, links: chain(m + 1, "dupla"), pointers: { cabeca: 0, cauda: m }, highlight: [n.id], message: `atual.prox aponta para ${value}. Inserção concluída.` }));
  return dOp("inserirEm", code, withN, s);
}

/* ------------------- religação comum às duas remoções ------------------- */
interface RemovalLines {
  left: number;
  head: number;
  right: number;
  tail: number;
}

/**
 * Passos que desligam o nó `pos` da lista dupla: primeiro o lado esquerdo
 * (ou a cabeça), depois o lado direito (ou a cauda).
 */
function dRelink(list: Node[], pos: number, lines: RemovalLines): Step[] {
  const m = list.length;
  const t = list[pos];
  const rest = list.filter((_, i) => i !== pos);
  const hasLeft = pos > 0;
  const hasRight = pos < m - 1;
  let links = chain(m, "dupla");
  const headIdx: number | null = hasLeft ? 0 : hasRight ? 1 : null;
  const s: Step[] = [];

  if (hasLeft) {
    links = patch(links, { prox: { [pos - 1]: hasRight ? pos + 1 : null } });
    s.push(
      listStep({
        line: lines.left, nodes: list, links, pointers: { cabeca: 0, cauda: m - 1, alvo: pos }, highlight: [], removing: t.id,
        message: `O vizinho da esquerda (${list[pos - 1].value}) passa a apontar para ${valOrNull(list[pos + 1])}.`,
        predict: ask(
          "Como saltamos o alvo pelo lado esquerdo?",
          "alvo.ant.prox = alvo.prox",
          [
            { text: "alvo.prox = null", misconception: "ordem-religacao-remocao" },
            { text: "alvo.ant = alvo.prox", misconception: "dupla-um-lado" },
            { text: "cabeca = alvo.ant", misconception: "no-vs-ponteiro" },
          ],
          { id: "dlist.remove.left", concept: "lista.religar-remocao", explain: "O vizinho da esquerda (alvo.ant) passa a apontar para o seguinte do alvo. Depois o da direita aponta de volta." },
        ),
      }),
    );
  } else {
    s.push(
      listStep({
        line: lines.head, nodes: list, links, pointers: { cabeca: headIdx, cauda: m - 1, alvo: pos }, removing: t.id,
        message: `O alvo não tem anterior: cabeca avança para ${valOrNull(list[1])}.`,
        predict: ask(
          "O alvo é a cabeça (não tem anterior). O que muda?",
          "cabeca passa a ser alvo.prox",
          [
            { text: "alvo.ant.prox = alvo.prox", misconception: "null-significado" },
            { text: "cauda = alvo.prox", misconception: "no-vs-ponteiro" },
            { text: "alvo.prox = null", misconception: "ordem-religacao-remocao" },
          ],
          { id: "dlist.remove.head", concept: "lista.cabeca", explain: "Sem anterior, não há quem religar à esquerda: a cabeça apenas avança para o próximo nó." },
        ),
      }),
    );
  }

  if (hasRight) {
    links = patch(links, { ant: { [pos + 1]: hasLeft ? pos - 1 : null } });
    s.push(
      listStep({
        line: lines.right, nodes: list, links, pointers: { cabeca: headIdx, cauda: m - 1, alvo: pos }, removing: t.id,
        message: `O vizinho da direita (${list[pos + 1].value}) passa a apontar de volta para ${valOrNull(list[pos - 1])}.`,
      }),
    );
  } else {
    s.push(
      listStep({
        line: lines.tail, nodes: list, links, pointers: { cabeca: headIdx, cauda: hasLeft ? pos - 1 : null, alvo: pos }, removing: t.id,
        message: `O alvo não tem próximo: cauda recua para ${valOrNull(list[pos - 1])}.`,
      }),
    );
  }

  s.push(
    listStep({
      line: hasRight ? lines.right : lines.tail, nodes: rest, links: chain(rest.length, "dupla"),
      pointers: ends(rest.length), message: `Nó ${t.value} removido.`,
    }),
  );
  return s;
}

/* ----------------------------- removerEm ----------------------------- */
export function dRemoveAt(list: Node[], pos: number): Op {
  const code = dlistCode.removeAt;
  const m = list.length;
  if (badPos(pos, m - 1)) {
    return dOp("removerEm", code, list, [
      listStep({
        line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), error: true,
        message: m ? `Posição ${posText(pos)} inválida (0 a ${m - 1}).` : "Lista vazia: nada a remover.",
      }),
    ]);
  }
  const rest = list.filter((_, i) => i !== pos);
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `removerEm(${pos})`, vars: { pos: `${pos}` } }),
    listStep({ line: 1, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: 0 }), highlight: [list[0].id], message: "alvo começa na cabeça." }),
  ];
  for (let i = 0; i < pos; i++) {
    s.push(listStep({ line: 2, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: i + 1 }), highlight: [list[i + 1].id], message: `alvo avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } }));
  }
  s.push(...dRelink(list, pos, { left: 3, head: 4, right: 5, tail: 6 }));
  return dOp("removerEm", code, rest, s);
}

/* ---------------------------- removerValor ---------------------------- */
export function dRemoveValue(list: Node[], value: number): Op {
  const code = dlistCode.removeValue;
  const m = list.length;
  const s: Step[] = [
    listStep({ line: 0, nodes: list, links: chain(m, "dupla"), pointers: ends(m), message: `removerValor(${value})`, vars: { valor: `${value}` } }),
    listStep({ line: 1, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: m ? 0 : null }), highlight: m ? [list[0].id] : [], message: m ? "alvo começa na cabeça." : "Lista vazia: alvo = null." }),
  ];
  let i = 0;
  while (i < m && list[i].value !== value) {
    s.push(listStep({ line: 2, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: i }), highlight: [list[i].id], message: `${list[i].value} ≠ ${value}: continuamos.`, vars: { "alvo.valor": `${list[i].value}` } }));
    s.push(listStep({ line: 3, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: i + 1 < m ? i + 1 : null }), highlight: i + 1 < m ? [list[i + 1].id] : [], message: i + 1 < m ? `alvo avança para ${list[i + 1].value}.` : "alvo avança e vira null." }));
    i++;
  }
  if (i >= m) {
    s.push(listStep({ line: 4, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: null }), message: m ? `${value} não está na lista. Nada muda.` : "Lista vazia: nada a remover.", error: true, vars: { alvo: "null" } }));
    return dOp("removerValor", code, list, s);
  }
  s.push(listStep({ line: 2, nodes: list, links: chain(m, "dupla"), pointers: ends(m, { alvo: i }), highlight: [list[i].id], message: `Achamos ${value} na posição ${i}.`, vars: { "alvo.valor": `${value}` } }));
  s.push(...dRelink(list, i, { left: 5, head: 6, right: 7, tail: 8 }));
  return dOp("removerValor", code, list.filter((_, k) => k !== i), s);
}

/* ------------------------------- buscar ------------------------------- */
export function dSearch(list: Node[], value: number): Op {
  const code = dlistCode.search;
  const m = list.length;
  const links = chain(m, "dupla");
  const s: Step[] = [listStep({ line: 0, nodes: list, links, pointers: ends(m), message: `buscar(${value})` })];
  for (let i = 0; i < m; i++) {
    s.push(listStep({ line: 2, nodes: list, links, pointers: ends(m, { atual: i }), highlight: [list[i].id], message: `atual = ${list[i].value}, i = ${i}.`, vars: { i: `${i}`, atual: `${list[i].value}` } }));
    const hit = list[i].value === value;
    s.push(listStep({ line: 3, nodes: list, links, pointers: ends(m, { atual: i }), highlight: [list[i].id], message: hit ? `Encontrado na posição ${i}!` : `${list[i].value} ≠ ${value}.`, vars: { retorno: hit ? `${i}` : "-" } }));
    if (hit) return dOp("buscar", code, list, s);
    s.push(
      listStep({
        line: 4, nodes: list, links, pointers: ends(m, { atual: i + 1 < m ? i + 1 : null }), message: "Avançamos.", vars: { i: `${i + 1}` },
        predict: i === 0
          ? ask(
              `${list[i].value} é diferente de ${value}. E agora?`,
              "atual avança para o próximo nó",
              ["Retorna -1", "Retorna 0", { text: "Remove o nó", misconception: "no-vs-ponteiro" }],
              { id: "dlist.search.percurso", concept: "lista.percurso", explain: "A busca percorre a lista para frente; só devolve -1 depois de passar por todos os nós." },
            )
          : undefined,
      }),
    );
  }
  s.push(listStep({ line: 6, nodes: list, links, pointers: ends(m), message: `${value} não está na lista. Retorna -1.`, vars: { retorno: "-1" }, error: true }));
  return dOp("buscar", code, list, s);
}
