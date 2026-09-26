export type CodeLang = "js" | "python" | "java" | "c" | "cpp";

export const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
];

export type CodeOp =
  | "push"
  | "pop"
  | "insertAtHead"
  | "insertAtTail"
  | "remove";

export function snippetFor(
  lang: CodeLang,
  op: CodeOp,
  value: number
): string {
  return SNIPPETS[op][lang].replace(/__VALUE__/g, String(value));
}

const SNIPPETS: Record<CodeOp, Record<CodeLang, string>> = {
  push: {
    js: `function push(value) {
  // LIFO: só o topo muda
  const topo = pilha.length;
  pilha[topo] = value;
}

push(__VALUE__);`,
    python: `def push(value):
    # LIFO: só o topo muda
    topo = len(pilha)
    pilha.append(value)

push(__VALUE__)`,
    java: `void push(int value) {
  // LIFO: só o topo muda
  int topo = pilha.size();
  pilha.add(value);
}

push(__VALUE__);`,
    c: `void push(int value) {
  // LIFO: só o topo muda
  topo = topo + 1;
  pilha[topo] = value;
}

push(__VALUE__);`,
    cpp: `void push(int value) {
  // LIFO: só o topo muda
  pilha.push_back(value);
}

push(__VALUE__);`,
  },
  pop: {
    js: `function pop() {
  if (pilha.length === 0) return; // underflow
  const valor = pilha[pilha.length - 1];
  pilha.length = pilha.length - 1;
  return valor;
}

pop();`,
    python: `def pop():
    if len(pilha) == 0:
        return  # underflow
    valor = pilha[-1]
    pilha.pop()
    return valor

pop()`,
    java: `int pop() {
  if (pilha.isEmpty()) return 0; // underflow
  int valor = pilha.get(pilha.size() - 1);
  pilha.remove(pilha.size() - 1);
  return valor;
}

pop();`,
    c: `int pop() {
  if (topo < 0) return 0; // underflow
  valor = pilha[topo];
  topo = topo - 1;
  return valor;
}

pop();`,
    cpp: `int pop() {
  if (pilha.empty()) return 0; // underflow
  int valor = pilha.back();
  pilha.pop_back();
  return valor;
}

pop();`,
  },
  insertAtHead: {
    js: `function insertAtHead(value) {
  const novo = criarNo(value);
  novo.next = head;
  head = novo;
}

insertAtHead(__VALUE__);`,
    python: `def insert_at_head(value):
    novo = criar_no(value)
    novo.next = head
    head = novo

insert_at_head(__VALUE__)`,
    java: `void insertAtHead(int value) {
  Node novo = criarNo(value);
  novo.next = head;
  head = novo;
}

insertAtHead(__VALUE__);`,
    c: `void insertAtHead(int value) {
  Node* novo = criarNo(value);
  novo->next = head;
  head = novo;
}

insertAtHead(__VALUE__);`,
    cpp: `void insertAtHead(int value) {
  Node* novo = criarNo(value);
  novo->next = head;
  head = novo;
}

insertAtHead(__VALUE__);`,
  },
  insertAtTail: {
    js: `function insertAtTail(value) {
  const novo = criarNo(value);
  if (head == null) { head = novo; return; }
  let atual = head;
  while (atual.next != null) atual = atual.next;
  atual.next = novo;
}

insertAtTail(__VALUE__);`,
    python: `def insert_at_tail(value):
    novo = criar_no(value)
    if head is None:
        head = novo
        return
    atual = head
    while atual.next is not None:
        atual = atual.next
    atual.next = novo

insert_at_tail(__VALUE__)`,
    java: `void insertAtTail(int value) {
  Node novo = criarNo(value);
  if (head == null) { head = novo; return; }
  Node atual = head;
  while (atual.next != null) atual = atual.next;
  atual.next = novo;
}

insertAtTail(__VALUE__);`,
    c: `void insertAtTail(int value) {
  Node* novo = criarNo(value);
  if (head == NULL) { head = novo; return; }
  Node* atual = head;
  while (atual->next != NULL) atual = atual->next;
  atual->next = novo;
}

insertAtTail(__VALUE__);`,
    cpp: `void insertAtTail(int value) {
  Node* novo = criarNo(value);
  if (head == nullptr) { head = novo; return; }
  Node* atual = head;
  while (atual->next != nullptr) atual = atual->next;
  atual->next = novo;
}

insertAtTail(__VALUE__);`,
  },
  remove: {
    js: `function remove(value) {
  if (head == null) return;
  if (head.value == value) { head = head.next; return; }
  let atual = head;
  while (atual.next != null && atual.next.value != value)
    atual = atual.next;
  if (atual.next != null) atual.next = atual.next.next;
}

remove(__VALUE__);`,
    python: `def remove(value):
    if head is None:
        return
    if head.value == value:
        head = head.next
        return
    atual = head
    while atual.next is not None and atual.next.value != value:
        atual = atual.next
    if atual.next is not None:
        atual.next = atual.next.next

remove(__VALUE__)`,
    java: `void remove(int value) {
  if (head == null) return;
  if (head.value == value) { head = head.next; return; }
  Node atual = head;
  while (atual.next != null && atual.next.value != value)
    atual = atual.next;
  if (atual.next != null) atual.next = atual.next.next;
}

remove(__VALUE__);`,
    c: `void remove(int value) {
  if (head == NULL) return;
  if (head->value == value) { head = head->next; return; }
  Node* atual = head;
  while (atual->next != NULL && atual->next->value != value)
    atual = atual->next;
  if (atual->next != NULL) atual->next = atual->next->next;
}

remove(__VALUE__);`,
    cpp: `void remove(int value) {
  if (head == nullptr) return;
  if (head->value == value) { head = head->next; return; }
  Node* atual = head;
  while (atual->next != nullptr && atual->next->value != value)
    atual = atual->next;
  if (atual->next != nullptr) atual->next = atual->next->next;
}

remove(__VALUE__);`,
  },
};
