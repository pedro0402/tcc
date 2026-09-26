// Motor portado do EstruturaViva: cada operação gera a sequência de passos
// (estado visual + linha de código + ponteiros + variáveis + previsão).
//
// Convenção de previsão: a pergunta fica no passo que ela revela. O player
// pausa ANTES de mostrar esse passo, então o aluno responde vendo o passo
// anterior e depois confere a resposta no desenho.

export type Node = { id: number; value: number };
export type Predict = { question: string; options: string[]; answer: number };
export type Step = {
  line: number; // índice da linha de código (0-based), -1 = nenhuma
  nodes: Node[];
  pointers: Record<string, number | null>; // nome -> índice do nó
  highlight: number[]; // ids destacados
  removing?: number; // id sendo removido
  message: string;
  vars: Record<string, string>;
  predict?: Predict;
  error?: boolean;
};
export type Structure = "stack" | "linkedList";
export type Op = {
  name: string;
  structure: Structure;
  steps: Step[];
  code: string[];
  final: Node[];
};

let nextId = 1;
export const mk = (value: number): Node => ({ id: nextId++, value });

function shuffle(correct: string, wrong: string[]): Omit<Predict, "question"> {
  const opts = Array.from(new Set([correct, ...wrong])).slice(0, 4);
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { options: opts, answer: opts.indexOf(correct) };
}

const ask = (question: string, correct: string, wrong: string[]): Predict => ({
  ...shuffle(correct, wrong),
  question,
});

const valOrNull = (n: Node | undefined) => (n ? `${n.value}` : "null");
const isIndex = (n: number) => Number.isInteger(n);

/* ======================= PILHA ======================= */
export const stackCode = {
  push: ["push(valor) {", "  novo = new No(valor)", "  novo.prox = topo", "  topo = novo", "  tamanho++", "}"],
  pop: [
    "pop() {",
    "  if (topo == null)",
    '    throw "Underflow"',
    "  valor = topo.valor",
    "  topo = topo.prox",
    "  tamanho--",
    "  return valor",
    "}",
  ],
  peek: ["peek() {", "  if (topo == null)", '    throw "Pilha vazia"', "  return topo.valor", "}"],
  isEmpty: ["isEmpty() {", "  return topo == null", "}"],
};

// nodes[0] = topo
export function stackPush(stack: Node[], value: number): Op {
  const n = mk(value);
  const top = stack.length ? 0 : null;
  const withN = [n, ...stack];
  const steps: Step[] = [
    { line: 0, nodes: stack, pointers: { topo: top }, highlight: [], message: `Chamando push(${value}).`, vars: { valor: `${value}` } },
    { line: 1, nodes: withN, pointers: { topo: top === null ? null : 1, novo: 0 }, highlight: [n.id], message: `Criamos um novo nó com o valor ${value}.`, vars: { valor: `${value}`, "novo.prox": "null" } },
    { line: 2, nodes: withN, pointers: { topo: top === null ? null : 1, novo: 0 }, highlight: [n.id], message: `novo.prox passa a apontar para o topo atual (${valOrNull(stack[0])}).`, vars: { "novo.prox": valOrNull(stack[0]) } },
    { line: 3, nodes: withN, pointers: { topo: 0 }, highlight: [n.id], message: `O topo agora é o nó ${value}.`, vars: { topo: `${value}` },
      predict: ask("Qual será o próximo passo?", "topo passa a apontar para o novo nó", ["O novo nó é colocado no fim da pilha", "tamanho é decrementado", "O topo antigo é removido"]) },
    { line: 4, nodes: withN, pointers: { topo: 0 }, highlight: [], message: `Tamanho atualizado para ${stack.length + 1}.`, vars: { tamanho: `${stack.length + 1}` } },
  ];
  return { name: "push", structure: "stack", steps, code: stackCode.push, final: withN };
}

export function stackPop(stack: Node[]): Op {
  const code = stackCode.pop;
  const empty = !stack.length;
  const guess = ask(
    empty ? "A pilha está vazia. O que acontece?" : "A pilha tem elementos. O que acontece?",
    empty ? "Lança erro de underflow" : "Lê o valor do topo",
    empty ? ["Retorna 0", "Remove o último nó", "Cria um nó vazio"] : ["Lança erro de underflow", "Percorre até o fim", "Insere null"],
  );
  const steps: Step[] = [
    { line: 0, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: "Chamando pop().", vars: {} },
    { line: 1, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: "Verificamos se a pilha está vazia.", vars: { "topo == null": `${empty}` } },
  ];
  if (empty) {
    steps.push({ line: 2, nodes: stack, pointers: { topo: null }, highlight: [], message: "Underflow: não há elementos para remover!", vars: {}, error: true, predict: guess });
    return { name: "pop", structure: "stack", steps, code, final: stack };
  }
  const t = stack[0];
  const rest = stack.slice(1);
  steps.push(
    { line: 3, nodes: stack, pointers: { topo: 0 }, highlight: [t.id], message: `Guardamos o valor do topo: ${t.value}.`, vars: { valor: `${t.value}` }, predict: guess },
    { line: 4, nodes: stack, pointers: { topo: stack.length > 1 ? 1 : null }, highlight: [], removing: t.id, message: `topo avança para ${valOrNull(rest[0])}.`, vars: { topo: valOrNull(rest[0]) } },
    { line: 5, nodes: rest, pointers: { topo: rest.length ? 0 : null }, highlight: [], message: `Tamanho atualizado para ${rest.length}.`, vars: { tamanho: `${rest.length}` } },
    { line: 6, nodes: rest, pointers: { topo: rest.length ? 0 : null }, highlight: [], message: `Retornamos ${t.value}.`, vars: { retorno: `${t.value}` } },
  );
  return { name: "pop", structure: "stack", steps, code, final: rest };
}

export function stackPeek(stack: Node[]): Op {
  const empty = !stack.length;
  const steps: Step[] = [
    { line: 0, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: "Chamando peek().", vars: {} },
    { line: 1, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: "Verificamos se a pilha está vazia.", vars: { "topo == null": `${empty}` } },
  ];
  if (empty) steps.push({ line: 2, nodes: stack, pointers: { topo: null }, highlight: [], message: "Pilha vazia: não há topo para consultar.", vars: {}, error: true });
  else steps.push({ line: 3, nodes: stack, pointers: { topo: 0 }, highlight: [stack[0].id], message: `O topo é ${stack[0].value} (sem remover).`, vars: { retorno: `${stack[0].value}` } });
  return { name: "peek", structure: "stack", steps, code: stackCode.peek, final: stack };
}

export function stackIsEmpty(stack: Node[]): Op {
  const empty = !stack.length;
  return {
    name: "isEmpty",
    structure: "stack",
    code: stackCode.isEmpty,
    final: stack,
    steps: [
      { line: 0, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: "Chamando isEmpty().", vars: {} },
      { line: 1, nodes: stack, pointers: { topo: empty ? null : 0 }, highlight: [], message: empty ? "A pilha está vazia (true)." : "A pilha não está vazia (false).", vars: { retorno: `${empty}` } },
    ],
  };
}

/* ================== LISTA ENCADEADA ================== */
export const listCode = {
  insertHead: ["inserirInicio(valor) {", "  novo = new No(valor)", "  novo.prox = cabeca", "  cabeca = novo", "}"],
  insertTail: [
    "inserirFim(valor) {",
    "  novo = new No(valor)",
    "  if (cabeca == null) { cabeca = novo; return }",
    "  atual = cabeca",
    "  while (atual.prox != null)",
    "    atual = atual.prox",
    "  atual.prox = novo",
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
    "  if (pos == 0) { cabeca = cabeca.prox; return }",
    "  anterior = cabeca",
    "  for (i = 0; i < pos - 1; i++)",
    "    anterior = anterior.prox",
    "  alvo = anterior.prox",
    "  anterior.prox = alvo.prox",
    "}",
  ],
  removeValue: [
    "removerValor(valor) {",
    "  if (cabeca == null) return",
    "  if (cabeca.valor == valor) { cabeca = cabeca.prox; return }",
    "  anterior = cabeca",
    "  while (anterior.prox != null && anterior.prox.valor != valor)",
    "    anterior = anterior.prox",
    "  if (anterior.prox == null) return",
    "  anterior.prox = anterior.prox.prox",
    "}",
  ],
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

const listOp = (name: string, code: string[], final: Node[], steps: Step[]): Op => ({
  name,
  structure: "linkedList",
  code,
  final,
  steps,
});

export function listInsertHead(list: Node[], value: number): Op {
  const n = mk(value);
  const nl = [n, ...list];
  return listOp("inserirInicio", listCode.insertHead, nl, [
    { line: 0, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: `inserirInicio(${value})`, vars: { valor: `${value}` } },
    { line: 1, nodes: nl, pointers: { cabeca: list.length ? 1 : null, novo: 0 }, highlight: [n.id], message: `Novo nó ${value} criado.`, vars: {} },
    { line: 2, nodes: nl, pointers: { cabeca: list.length ? 1 : null, novo: 0 }, highlight: [n.id], message: `novo.prox aponta para a cabeça atual (${valOrNull(list[0])}).`, vars: { "novo.prox": valOrNull(list[0]) } },
    { line: 3, nodes: nl, pointers: { cabeca: 0 }, highlight: [], message: `A cabeça agora é ${value}.`, vars: { cabeca: `${value}` },
      predict: ask("E agora?", "cabeca passa a apontar para o novo nó", ["Percorremos a lista até o fim", "O nó antigo é removido", "novo.prox recebe null"]) },
  ]);
}

export function listInsertTail(list: Node[], value: number): Op {
  const code = listCode.insertTail;
  const n = mk(value);
  const nl = [...list, n];
  const head = list.length ? 0 : null;
  const s: Step[] = [
    { line: 0, nodes: list, pointers: { cabeca: head }, highlight: [], message: `inserirFim(${value})`, vars: {} },
    { line: 1, nodes: list, pointers: { cabeca: head }, highlight: [], message: `Novo nó ${value} criado (ainda desconectado).`, vars: {} },
    { line: 2, nodes: list, pointers: { cabeca: head }, highlight: [], message: list.length ? "A lista não está vazia." : "Lista vazia: o novo nó vira a cabeça.", vars: { "cabeca == null": `${!list.length}` } },
  ];
  if (!list.length) {
    s.push({ line: 2, nodes: nl, pointers: { cabeca: 0 }, highlight: [n.id], message: `cabeca = ${value}.`, vars: {} });
    return listOp("inserirFim", code, nl, s);
  }
  s.push({ line: 3, nodes: list, pointers: { cabeca: 0, atual: 0 }, highlight: [list[0].id], message: "atual começa na cabeça.", vars: { atual: `${list[0].value}` } });
  for (let i = 0; i < list.length - 1; i++) {
    s.push({ line: 4, nodes: list, pointers: { cabeca: 0, atual: i }, highlight: [list[i].id], message: `atual.prox (${list[i + 1].value}) não é null, continuamos.`, vars: { atual: `${list[i].value}` } });
    s.push({ line: 5, nodes: list, pointers: { cabeca: 0, atual: i + 1 }, highlight: [list[i + 1].id], message: `atual avança para ${list[i + 1].value}.`, vars: { atual: `${list[i + 1].value}` },
      predict: i === 0 ? ask("atual.prox != null. O que acontece?", "atual avança para o próximo nó", ["O novo nó é ligado aqui", "O laço termina", "A cabeça muda"]) : undefined });
  }
  const last = list.length - 1;
  s.push({ line: 4, nodes: list, pointers: { cabeca: 0, atual: last }, highlight: [list[last].id], message: "atual.prox é null: chegamos ao último nó.", vars: { "atual.prox": "null" } });
  s.push({ line: 6, nodes: nl, pointers: { cabeca: 0, atual: last }, highlight: [n.id], message: `O último nó passa a apontar para ${value}.`, vars: {} });
  return listOp("inserirFim", code, nl, s);
}

export function listInsertAt(list: Node[], pos: number, value: number): Op {
  const code = listCode.insertAt;
  if (!isIndex(pos) || pos < 0 || pos > list.length) {
    return listOp("inserirEm", code, list, [
      { line: 0, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: `Posição ${Number.isNaN(pos) ? "vazia" : pos} inválida (0 a ${list.length}).`, vars: {}, error: true },
    ]);
  }
  if (pos === 0) {
    const r = listInsertHead(list, value);
    return listOp("inserirEm", code, r.final, [
      { line: 1, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: "pos == 0: inserção no início.", vars: { pos: "0" } },
      ...r.steps.slice(1).map((x) => ({ ...x, line: 1 })),
    ]);
  }
  const s: Step[] = [
    { line: 0, nodes: list, pointers: { cabeca: 0 }, highlight: [], message: `inserirEm(${pos}, ${value})`, vars: { pos: `${pos}` } },
    { line: 2, nodes: list, pointers: { cabeca: 0, atual: 0 }, highlight: [list[0].id], message: "atual começa na cabeça.", vars: { i: "0" } },
  ];
  for (let i = 0; i < pos - 1; i++) {
    s.push({ line: 4, nodes: list, pointers: { cabeca: 0, atual: i + 1 }, highlight: [list[i + 1].id], message: `atual avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } });
  }
  const a = pos - 1;
  const n = mk(value);
  const withN = [...list.slice(0, pos), n, ...list.slice(pos)];
  s.push({ line: 5, nodes: list, pointers: { cabeca: 0, atual: a }, highlight: [list[a].id], message: `atual está na posição ${a}. Criamos o nó ${value}.`, vars: {} });
  s.push({ line: 6, nodes: withN, pointers: { cabeca: 0, atual: a, novo: pos }, highlight: [n.id], message: `novo.prox aponta para ${valOrNull(list[pos])} (evita perder o resto da lista).`, vars: {},
    predict: ask("Qual ligação deve ser feita primeiro?", "novo.prox = atual.prox", ["atual.prox = novo", "cabeca = novo", "atual = null"]) });
  s.push({ line: 7, nodes: withN, pointers: { cabeca: 0 }, highlight: [n.id], message: `atual.prox aponta para ${value}. Inserção concluída.`, vars: {} });
  return listOp("inserirEm", code, withN, s);
}

export function listRemoveAt(list: Node[], pos: number): Op {
  const code = listCode.removeAt;
  if (!isIndex(pos) || pos < 0 || pos >= list.length) {
    return listOp("removerEm", code, list, [
      { line: 0, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: list.length ? `Posição ${Number.isNaN(pos) ? "vazia" : pos} inválida (0 a ${list.length - 1}).` : "Lista vazia: nada a remover.", vars: {}, error: true },
    ]);
  }
  const rest = list.filter((_, i) => i !== pos);
  if (pos === 0) {
    return listOp("removerEm", code, rest, [
      { line: 0, nodes: list, pointers: { cabeca: 0 }, highlight: [], message: "removerEm(0)", vars: {} },
      { line: 1, nodes: list, pointers: { cabeca: list.length > 1 ? 1 : null }, highlight: [], removing: list[0].id, message: "cabeca avança para o próximo nó.", vars: {} },
      { line: 1, nodes: rest, pointers: { cabeca: rest.length ? 0 : null }, highlight: [], message: `Nó ${list[0].value} removido.`, vars: {} },
    ]);
  }
  const s: Step[] = [
    { line: 0, nodes: list, pointers: { cabeca: 0 }, highlight: [], message: `removerEm(${pos})`, vars: {} },
    { line: 2, nodes: list, pointers: { cabeca: 0, anterior: 0 }, highlight: [list[0].id], message: "anterior começa na cabeça.", vars: {} },
  ];
  for (let i = 0; i < pos - 1; i++) s.push({ line: 4, nodes: list, pointers: { cabeca: 0, anterior: i + 1 }, highlight: [list[i + 1].id], message: `anterior avança para ${list[i + 1].value}.`, vars: { i: `${i + 1}` } });
  s.push({ line: 5, nodes: list, pointers: { cabeca: 0, anterior: pos - 1, alvo: pos }, highlight: [list[pos].id], message: `alvo = ${list[pos].value}.`, vars: {} });
  s.push({ line: 6, nodes: list, pointers: { cabeca: 0, anterior: pos - 1 }, highlight: [], removing: list[pos].id, message: `anterior pula o alvo e aponta para ${valOrNull(list[pos + 1])}.`, vars: {},
    predict: ask("Como desligamos o alvo?", "anterior.prox = alvo.prox", ["alvo.prox = null apenas", "cabeca = alvo", "anterior = alvo"]) });
  s.push({ line: 6, nodes: rest, pointers: { cabeca: 0 }, highlight: [], message: `Nó ${list[pos].value} removido.`, vars: {} });
  return listOp("removerEm", code, rest, s);
}

export function listRemoveValue(list: Node[], value: number): Op {
  const code = listCode.removeValue;
  const s: Step[] = [
    { line: 0, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: `removerValor(${value})`, vars: { valor: `${value}` } },
    { line: 1, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: list.length ? "A lista não está vazia." : "Lista vazia: nada a remover.", vars: { "cabeca == null": `${!list.length}` }, error: !list.length || undefined },
  ];
  if (!list.length) return listOp("removerValor", code, list, s);

  const hitIndex = list.findIndex((n) => n.value === value);
  const rest = list.filter((_, i) => i !== hitIndex);
  if (list[0].value === value) {
    s.push(
      { line: 2, nodes: list, pointers: { cabeca: 0 }, highlight: [list[0].id], message: `A cabeça guarda ${value}.`, vars: { "cabeca.valor": `${value}` } },
      { line: 2, nodes: list, pointers: { cabeca: list.length > 1 ? 1 : null }, highlight: [], removing: list[0].id, message: `cabeca avança para ${valOrNull(list[1])}.`, vars: { cabeca: valOrNull(list[1]) },
        predict: ask("O valor está na cabeça. O que fazemos?", "cabeca passa a apontar para cabeca.prox", ["Percorremos até o fim", "Apagamos a lista inteira", "anterior.prox = null"]) },
      { line: 2, nodes: rest, pointers: { cabeca: rest.length ? 0 : null }, highlight: [], message: `Nó ${value} removido.`, vars: {} },
    );
    return listOp("removerValor", code, rest, s);
  }

  s.push({ line: 3, nodes: list, pointers: { cabeca: 0, anterior: 0 }, highlight: [list[0].id], message: "anterior começa na cabeça.", vars: { anterior: `${list[0].value}` } });
  let i = 0;
  while (i + 1 < list.length && list[i + 1].value !== value) {
    s.push({ line: 4, nodes: list, pointers: { cabeca: 0, anterior: i }, highlight: [list[i + 1].id], message: `anterior.prox é ${list[i + 1].value}, diferente de ${value}.`, vars: { "anterior.prox.valor": `${list[i + 1].value}` } });
    s.push({ line: 5, nodes: list, pointers: { cabeca: 0, anterior: i + 1 }, highlight: [list[i + 1].id], message: `anterior avança para ${list[i + 1].value}.`, vars: { anterior: `${list[i + 1].value}` },
      predict: i === 0 ? ask(`${list[1].value} ≠ ${value}. E agora?`, "anterior avança para o próximo nó", ["Removemos o nó atual", "O laço termina", "A cabeça muda"]) : undefined });
    i++;
  }
  if (i + 1 >= list.length) {
    s.push({ line: 6, nodes: list, pointers: { cabeca: 0, anterior: i }, highlight: [], message: `${value} não está na lista. Nada muda.`, vars: { "anterior.prox": "null" }, error: true });
    return listOp("removerValor", code, list, s);
  }
  const target = list[i + 1];
  s.push({ line: 4, nodes: list, pointers: { cabeca: 0, anterior: i, alvo: i + 1 }, highlight: [target.id], message: `anterior.prox guarda ${value}: encontramos o alvo.`, vars: { "anterior.prox.valor": `${value}` } });
  s.push({ line: 7, nodes: list, pointers: { cabeca: 0, anterior: i }, highlight: [], removing: target.id, message: `anterior pula o alvo e aponta para ${valOrNull(list[i + 2])}.`, vars: { "anterior.prox": valOrNull(list[i + 2]) },
    predict: ask("Como desligamos o alvo?", "anterior.prox = anterior.prox.prox", ["alvo.prox = null apenas", "cabeca = alvo", "anterior = null"]) });
  s.push({ line: 7, nodes: rest, pointers: { cabeca: 0 }, highlight: [], message: `Nó ${value} removido.`, vars: {} });
  return listOp("removerValor", code, rest, s);
}

export function listSearch(list: Node[], value: number): Op {
  const code = listCode.search;
  const s: Step[] = [{ line: 0, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: `buscar(${value})`, vars: {} }];
  for (let i = 0; i < list.length; i++) {
    s.push({ line: 2, nodes: list, pointers: { cabeca: 0, atual: i }, highlight: [list[i].id], message: `atual = ${list[i].value}, i = ${i}.`, vars: { i: `${i}`, atual: `${list[i].value}` } });
    const hit = list[i].value === value;
    s.push({ line: 3, nodes: list, pointers: { cabeca: 0, atual: i }, highlight: [list[i].id], message: hit ? `Encontrado na posição ${i}!` : `${list[i].value} ≠ ${value}.`, vars: { retorno: hit ? `${i}` : "-" } });
    if (hit) return listOp("buscar", code, list, s);
    s.push({ line: 4, nodes: list, pointers: { cabeca: 0, atual: i + 1 < list.length ? i + 1 : null }, highlight: [], message: "Avançamos.", vars: { i: `${i + 1}` },
      predict: i === 0 ? ask(`${list[i].value} é diferente de ${value}. E agora?`, "atual avança para o próximo nó", ["Retorna -1", "Retorna 0", "Remove o nó"]) : undefined });
  }
  s.push({ line: 6, nodes: list, pointers: { cabeca: list.length ? 0 : null }, highlight: [], message: `${value} não está na lista. Retorna -1.`, vars: { retorno: "-1" }, error: true });
  return listOp("buscar", code, list, s);
}
