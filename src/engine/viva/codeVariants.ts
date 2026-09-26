// Traduções do código de cada operação para as linguagens exibidas no painel.
// Regra fundamental: cada variante tem EXATAMENTE o mesmo número de linhas do
// pseudocódigo do motor (engine.ts), pois o realce usa step.line (0-based).
// A variante "humano" descreve cada linha em português corrente.

import { listCode, stackCode } from "./engine";

export type CodeLang = "humano" | "js" | "python" | "java" | "c";

export const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: "humano", label: "Humano" },
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
];

// Cada entrada mapeia o nome da operação -> por linguagem -> linhas.
// "pseudo" reaproveita o próprio código do motor (o texto exibido hoje).
type Variants = Record<CodeLang | "pseudo", string[]>;

const V = (
  pseudo: string[],
  humano: string[],
  js: string[],
  python: string[],
  java: string[],
  c: string[]
): Variants => ({ pseudo, humano, js, python, java, c });

const BANK: Record<string, Variants> = {
  /* ------------------------- PILHA ------------------------- */
  push: V(
    stackCode.push,
    [
      "empilhar(valor):",
      "  cria um nó com o valor",
      "  liga esse nó ao topo atual",
      "  o topo passa a ser o novo nó",
      "  soma 1 ao tamanho",
      "fim",
    ],
    [
      "function push(valor) {",
      "  const novo = { valor, prox: null };",
      "  novo.prox = topo;",
      "  topo = novo;",
      "  tamanho++;",
      "}",
    ],
    [
      "def push(valor):",
      "    novo = No(valor)",
      "    novo.prox = topo",
      "    topo = novo",
      "    tamanho += 1",
      "",
    ],
    [
      "void push(int valor) {",
      "  No novo = new No(valor);",
      "  novo.prox = topo;",
      "  topo = novo;",
      "  tamanho++;",
      "}",
    ],
    [
      "void push(int valor) {",
      "  No* novo = criarNo(valor);",
      "  novo->prox = topo;",
      "  topo = novo;",
      "  tamanho++;",
      "}",
    ]
  ),

  pop: V(
    stackCode.pop,
    [
      "desempilhar():",
      "  se o topo for nulo",
      '    erro: pilha vazia (underflow)',
      "  guarda o valor do topo",
      "  o topo passa a ser o próximo",
      "  diminui 1 do tamanho",
      "  devolve o valor guardado",
      "fim",
    ],
    [
      "function pop() {",
      "  if (topo === null)",
      '    throw new Error("Underflow");',
      "  const valor = topo.valor;",
      "  topo = topo.prox;",
      "  tamanho--;",
      "  return valor;",
      "}",
    ],
    [
      "def pop():",
      "    if topo is None:",
      '        raise Exception("Underflow")',
      "    valor = topo.valor",
      "    topo = topo.prox",
      "    tamanho -= 1",
      "    return valor",
      "",
    ],
    [
      "int pop() {",
      "  if (topo == null)",
      '    throw new RuntimeException("Underflow");',
      "  int valor = topo.valor;",
      "  topo = topo.prox;",
      "  tamanho--;",
      "  return valor;",
      "}",
    ],
    [
      "int pop() {",
      "  if (topo == NULL)",
      '    erro("Underflow");',
      "  int valor = topo->valor;",
      "  topo = topo->prox;",
      "  tamanho--;",
      "  return valor;",
      "}",
    ]
  ),

  peek: V(
    stackCode.peek,
    [
      "consultarTopo():",
      "  se o topo for nulo",
      "    erro: pilha vazia",
      "  devolve o valor do topo (sem remover)",
      "fim",
    ],
    [
      "function peek() {",
      "  if (topo === null)",
      '    throw new Error("Pilha vazia");',
      "  return topo.valor;",
      "}",
    ],
    [
      "def peek():",
      "    if topo is None:",
      '        raise Exception("Pilha vazia")',
      "    return topo.valor",
      "",
    ],
    [
      "int peek() {",
      "  if (topo == null)",
      '    throw new RuntimeException("Pilha vazia");',
      "  return topo.valor;",
      "}",
    ],
    [
      "int peek() {",
      "  if (topo == NULL)",
      '    erro("Pilha vazia");',
      "  return topo->valor;",
      "}",
    ]
  ),

  isEmpty: V(
    stackCode.isEmpty,
    ["estaVazia():", "  devolve verdadeiro se o topo for nulo", "fim"],
    ["function isEmpty() {", "  return topo === null;", "}"],
    ["def is_empty():", "    return topo is None", ""],
    ["boolean isEmpty() {", "  return topo == null;", "}"],
    ["int isEmpty() {", "  return topo == NULL;", "}"]
  ),

  /* --------------------- LISTA ENCADEADA -------------------- */
  inserirInicio: V(
    listCode.insertHead,
    [
      "inserirInicio(valor):",
      "  cria um nó com o valor",
      "  liga esse nó à cabeça atual",
      "  a cabeça passa a ser o novo nó",
      "fim",
    ],
    [
      "function inserirInicio(valor) {",
      "  const novo = { valor, prox: null };",
      "  novo.prox = cabeca;",
      "  cabeca = novo;",
      "}",
    ],
    [
      "def inserir_inicio(valor):",
      "    novo = No(valor)",
      "    novo.prox = cabeca",
      "    cabeca = novo",
      "",
    ],
    [
      "void inserirInicio(int valor) {",
      "  No novo = new No(valor);",
      "  novo.prox = cabeca;",
      "  cabeca = novo;",
      "}",
    ],
    [
      "void inserirInicio(int valor) {",
      "  No* novo = criarNo(valor);",
      "  novo->prox = cabeca;",
      "  cabeca = novo;",
      "}",
    ]
  ),

  inserirFim: V(
    listCode.insertTail,
    [
      "inserirFim(valor):",
      "  cria um nó com o valor",
      "  se a lista está vazia, a cabeça vira o novo nó e retorna",
      "  começa em 'atual' na cabeça",
      "  enquanto atual tiver próximo",
      "    avança atual para o próximo",
      "  liga o último nó ao novo",
      "fim",
    ],
    [
      "function inserirFim(valor) {",
      "  const novo = { valor, prox: null };",
      "  if (cabeca == null) { cabeca = novo; return; }",
      "  let atual = cabeca;",
      "  while (atual.prox != null)",
      "    atual = atual.prox;",
      "  atual.prox = novo;",
      "}",
    ],
    [
      "def inserir_fim(valor):",
      "    novo = No(valor)",
      "    if cabeca is None: cabeca = novo; return",
      "    atual = cabeca",
      "    while atual.prox is not None:",
      "        atual = atual.prox",
      "    atual.prox = novo",
      "",
    ],
    [
      "void inserirFim(int valor) {",
      "  No novo = new No(valor);",
      "  if (cabeca == null) { cabeca = novo; return; }",
      "  No atual = cabeca;",
      "  while (atual.prox != null)",
      "    atual = atual.prox;",
      "  atual.prox = novo;",
      "}",
    ],
    [
      "void inserirFim(int valor) {",
      "  No* novo = criarNo(valor);",
      "  if (cabeca == NULL) { cabeca = novo; return; }",
      "  No* atual = cabeca;",
      "  while (atual->prox != NULL)",
      "    atual = atual->prox;",
      "  atual->prox = novo;",
      "}",
    ]
  ),

  inserirEm: V(
    listCode.insertAt,
    [
      "inserirEm(pos, valor):",
      "  se pos == 0, insere no início e retorna",
      "  começa em 'atual' na cabeça",
      "  repete pos-1 vezes",
      "    avança atual para o próximo",
      "  cria um nó com o valor",
      "  liga novo.prox ao próximo de atual",
      "  liga atual ao novo nó",
      "fim",
    ],
    [
      "function inserirEm(pos, valor) {",
      "  if (pos == 0) return inserirInicio(valor);",
      "  let atual = cabeca;",
      "  for (let i = 0; i < pos - 1; i++)",
      "    atual = atual.prox;",
      "  const novo = { valor, prox: null };",
      "  novo.prox = atual.prox;",
      "  atual.prox = novo;",
      "}",
    ],
    [
      "def inserir_em(pos, valor):",
      "    if pos == 0: return inserir_inicio(valor)",
      "    atual = cabeca",
      "    for i in range(pos - 1):",
      "        atual = atual.prox",
      "    novo = No(valor)",
      "    novo.prox = atual.prox",
      "    atual.prox = novo",
      "",
    ],
    [
      "void inserirEm(int pos, int valor) {",
      "  if (pos == 0) { inserirInicio(valor); return; }",
      "  No atual = cabeca;",
      "  for (int i = 0; i < pos - 1; i++)",
      "    atual = atual.prox;",
      "  No novo = new No(valor);",
      "  novo.prox = atual.prox;",
      "  atual.prox = novo;",
      "}",
    ],
    [
      "void inserirEm(int pos, int valor) {",
      "  if (pos == 0) { inserirInicio(valor); return; }",
      "  No* atual = cabeca;",
      "  for (int i = 0; i < pos - 1; i++)",
      "    atual = atual->prox;",
      "  No* novo = criarNo(valor);",
      "  novo->prox = atual->prox;",
      "  atual->prox = novo;",
      "}",
    ]
  ),

  removerEm: V(
    listCode.removeAt,
    [
      "removerEm(pos):",
      "  se pos == 0, a cabeça vira o próximo e retorna",
      "  começa em 'anterior' na cabeça",
      "  repete pos-1 vezes",
      "    avança anterior para o próximo",
      "  'alvo' é o próximo de anterior",
      "  anterior salta o alvo e aponta para o seguinte",
      "fim",
    ],
    [
      "function removerEm(pos) {",
      "  if (pos == 0) { cabeca = cabeca.prox; return; }",
      "  let anterior = cabeca;",
      "  for (let i = 0; i < pos - 1; i++)",
      "    anterior = anterior.prox;",
      "  const alvo = anterior.prox;",
      "  anterior.prox = alvo.prox;",
      "}",
    ],
    [
      "def remover_em(pos):",
      "    if pos == 0: cabeca = cabeca.prox; return",
      "    anterior = cabeca",
      "    for i in range(pos - 1):",
      "        anterior = anterior.prox",
      "    alvo = anterior.prox",
      "    anterior.prox = alvo.prox",
      "",
    ],
    [
      "void removerEm(int pos) {",
      "  if (pos == 0) { cabeca = cabeca.prox; return; }",
      "  No anterior = cabeca;",
      "  for (int i = 0; i < pos - 1; i++)",
      "    anterior = anterior.prox;",
      "  No alvo = anterior.prox;",
      "  anterior.prox = alvo.prox;",
      "}",
    ],
    [
      "void removerEm(int pos) {",
      "  if (pos == 0) { cabeca = cabeca->prox; return; }",
      "  No* anterior = cabeca;",
      "  for (int i = 0; i < pos - 1; i++)",
      "    anterior = anterior->prox;",
      "  No* alvo = anterior->prox;",
      "  anterior->prox = alvo->prox;",
      "}",
    ]
  ),

  removerValor: V(
    listCode.removeValue,
    [
      "removerValor(valor):",
      "  se a lista está vazia, retorna",
      "  se a cabeça é o valor, a cabeça vira o próximo e retorna",
      "  começa em 'anterior' na cabeça",
      "  enquanto o próximo existir e não for o valor",
      "    avança anterior para o próximo",
      "  se não achou (próximo nulo), retorna",
      "  anterior salta o nó do valor",
      "fim",
    ],
    [
      "function removerValor(valor) {",
      "  if (cabeca == null) return;",
      "  if (cabeca.valor == valor) { cabeca = cabeca.prox; return; }",
      "  let anterior = cabeca;",
      "  while (anterior.prox != null && anterior.prox.valor != valor)",
      "    anterior = anterior.prox;",
      "  if (anterior.prox == null) return;",
      "  anterior.prox = anterior.prox.prox;",
      "}",
    ],
    [
      "def remover_valor(valor):",
      "    if cabeca is None: return",
      "    if cabeca.valor == valor: cabeca = cabeca.prox; return",
      "    anterior = cabeca",
      "    while anterior.prox is not None and anterior.prox.valor != valor:",
      "        anterior = anterior.prox",
      "    if anterior.prox is None: return",
      "    anterior.prox = anterior.prox.prox",
      "",
    ],
    [
      "void removerValor(int valor) {",
      "  if (cabeca == null) return;",
      "  if (cabeca.valor == valor) { cabeca = cabeca.prox; return; }",
      "  No anterior = cabeca;",
      "  while (anterior.prox != null && anterior.prox.valor != valor)",
      "    anterior = anterior.prox;",
      "  if (anterior.prox == null) return;",
      "  anterior.prox = anterior.prox.prox;",
      "}",
    ],
    [
      "void removerValor(int valor) {",
      "  if (cabeca == NULL) return;",
      "  if (cabeca->valor == valor) { cabeca = cabeca->prox; return; }",
      "  No* anterior = cabeca;",
      "  while (anterior->prox != NULL && anterior->prox->valor != valor)",
      "    anterior = anterior->prox;",
      "  if (anterior->prox == NULL) return;",
      "  anterior->prox = anterior->prox->prox;",
      "}",
    ]
  ),

  buscar: V(
    listCode.search,
    [
      "buscar(valor):",
      "  começa em 'atual' na cabeça, com i = 0",
      "  enquanto atual não for nulo",
      "    se atual.valor for o valor, devolve i",
      "    avança atual e soma 1 a i",
      "  fim do laço",
      "  devolve -1 (não encontrado)",
      "fim",
    ],
    [
      "function buscar(valor) {",
      "  let atual = cabeca, i = 0;",
      "  while (atual != null) {",
      "    if (atual.valor == valor) return i;",
      "    atual = atual.prox; i++;",
      "  }",
      "  return -1;",
      "}",
    ],
    [
      "def buscar(valor):",
      "    atual = cabeca; i = 0",
      "    while atual is not None:",
      "        if atual.valor == valor: return i",
      "        atual = atual.prox; i += 1",
      "    # fim do while",
      "    return -1",
      "",
    ],
    [
      "int buscar(int valor) {",
      "  No atual = cabeca; int i = 0;",
      "  while (atual != null) {",
      "    if (atual.valor == valor) return i;",
      "    atual = atual.prox; i++;",
      "  }",
      "  return -1;",
      "}",
    ],
    [
      "int buscar(int valor) {",
      "  No* atual = cabeca; int i = 0;",
      "  while (atual != NULL) {",
      "    if (atual->valor == valor) return i;",
      "    atual = atual->prox; i++;",
      "  }",
      "  return -1;",
      "}",
    ]
  ),
};

/** Devolve o código da operação na linguagem pedida, alinhado linha a linha. */
export function codeFor(opName: string, lang: CodeLang, pseudo: string[]): string[] {
  const variants = BANK[opName];
  if (!variants) return pseudo; // fallback: usa o pseudocódigo do motor
  const lines = variants[lang];
  // Garante alinhamento: se por algum motivo o tamanho divergir, cai no pseudo.
  return lines && lines.length === variants.pseudo.length ? lines : variants.pseudo;
}
