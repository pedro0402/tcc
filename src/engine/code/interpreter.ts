import { createStep } from "../steps/StepGenerator";
import type { Step, StructureSnapshot } from "../types";
import type { CodeLang, CodeOp } from "./languages";

export type InterpretOk = { ok: true; steps: Step[]; values: number[] };
export type InterpretErr = { ok: false; error: string };
export type InterpretResult = InterpretOk | InterpretErr;

interface SrcLine {
  n: number;
  raw: string;
  indent: number;
  text: string;
}

interface FnDef {
  name: string;
  params: string[];
  body: SrcLine[];
}

interface CallSite {
  name: string;
  args: string[];
  line: number;
}

type Value = number | string | boolean | null;

interface ListNode {
  id: string;
  value: number;
  next: string | null;
}

const OP_ALIASES: Record<string, CodeOp> = {
  push: "push",
  pop: "pop",
  remove: "remove",
  insertathead: "insertAtHead",
  insert_at_head: "insertAtHead",
  insertattail: "insertAtTail",
  insert_at_tail: "insertAtTail",
};

export function interpretCode(params: {
  code: string;
  lang: CodeLang;
  structure: "stack" | "linkedList";
  seed: number[];
  fallbackOp: CodeOp;
  fallbackValue: number;
}): InterpretResult {
  try {
    const lines = toSrcLines(params.code, params.lang);
    const { functions, calls } = parseScript(lines, params.lang);
    const sites =
      calls.length > 0
        ? calls
        : [
            {
              name: params.fallbackOp,
              args:
                params.fallbackOp === "pop"
                  ? []
                  : [String(params.fallbackValue)],
              line: lines[0]?.n ?? 1,
            },
          ];

    const runtime = new Runtime(params.structure, params.seed);
    const steps: Step[] = [];

    for (const site of sites) {
      const op = canonicalizeOp(site.name);
      const fn = findFunction(functions, site.name, op);
      const argValues = site.args.map((a) =>
        a.trim() === "" ? null : runtime.evalExpr(a)
      );
      if (params.structure === "stack") {
        runtime.vars.value =
          typeof argValues[0] === "number"
            ? argValues[0]
            : params.fallbackValue;
      } else {
        runtime.vars.value =
          typeof argValues[0] === "number"
            ? argValues[0]
            : params.fallbackValue;
      }

      if (fn) {
        fn.params.forEach((param, i) => {
          if (!param) return;
          runtime.vars[param] =
            (argValues[i] as Value) ?? runtime.vars.value ?? null;
        });
        const bodyResult = runtime.execBlock(fn.body, steps);
        if (bodyResult === "error") {
          return { ok: false, error: runtime.lastError ?? "Falha ao executar." };
        }
      } else if (op) {
        runtime.invokeBuiltin(op, steps, site.line);
      } else {
        return {
          ok: false,
          error: `Não reconheci a chamada "${site.name}".`,
        };
      }
    }

    if (steps.length === 0) {
      steps.push(
        createStep({
          lineHighlighted: 1,
          description: "Nada mudou — o código não executou uma operação visível.",
          snapshot: runtime.snapshot(),
          kind: "done",
          callout: "sem efeito",
        })
      );
    } else {
      const last = steps[steps.length - 1];
      if (last.kind !== "done") {
        steps.push(
          createStep({
            lineHighlighted: last.lineHighlighted,
            description: last.description,
            snapshot: runtime.snapshot(),
            kind: "done",
            callout: last.callout,
          })
        );
      }
    }

    return { ok: true, steps, values: runtime.values() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Código incompleto.";
    return { ok: false, error: message };
  }
}

function canonicalizeOp(name: string): CodeOp | null {
  return OP_ALIASES[name.replace(/\s/g, "").toLowerCase()] ?? null;
}

function findFunction(
  functions: Map<string, FnDef>,
  name: string,
  op: CodeOp | null
): FnDef | undefined {
  const key = name.replace(/\s/g, "").toLowerCase();
  for (const [k, fn] of functions) {
    if (k === key) return fn;
    if (op && canonicalizeOp(fn.name) === op) return fn;
  }
  return undefined;
}

function toSrcLines(code: string, lang: CodeLang): SrcLine[] {
  return code.split(/\n/).map((raw, i) => {
    const leading = raw.match(/^[\t ]*/)?.[0] ?? "";
    const indentSize = leading.replace(/\t/g, "    ").length;
    return {
      n: i + 1,
      raw,
      indent: indentSize,
      text: canonicalize(stripComments(raw, lang)),
    };
  });
}

function stripComments(line: string, lang: CodeLang): string {
  if (lang === "python") return line.replace(/#.*$/, "");
  return line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
}

function canonicalize(raw: string): string {
  return raw
    .replace(/\bNone\b/g, "null")
    .replace(/\bNULL\b/g, "null")
    .replace(/\bnullptr\b/g, "null")
    .replace(/\bis not\b/g, "!=")
    .replace(/\bis\b/g, "==")
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    .replace(/\bnot\b/g, "!")
    .replace(/->/g, ".")
    .replace(/===/g, "==")
    .replace(/!==/g, "!=")
    .replace(/^(?:const|let|var|int|void|Node\s*\*?)\s+/, "")
    .trim()
    .replace(/;+\s*$/, "");
}

function parseScript(
  lines: SrcLine[],
  lang: CodeLang
): { functions: Map<string, FnDef>; calls: CallSite[] } {
  const functions = new Map<string, FnDef>();
  const calls: CallSite[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const fn = tryParseFunction(lines, i, lang);
    if (!fn) continue;
    functions.set(fn.def.name.replace(/\s/g, "").toLowerCase(), fn.def);
    for (let k = fn.start; k <= fn.end; k++) consumed.add(k);
    i = fn.end;
  }

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const text = lines[i].text;
    if (!text || text === "{" || text === "}") continue;
    const call = parseCallLine(text, lines[i].n);
    if (call) calls.push(call);
  }

  return { functions, calls };
}

function tryParseFunction(
  lines: SrcLine[],
  i: number,
  lang: CodeLang
): { def: FnDef; start: number; end: number } | null {
  const text = lines[i].text;
  const py = text.match(/^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:$/);
  const cLike = text.match(
    /^(?:function\s+)?([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(\{)?$/
  );

  if (lang === "python" && py) {
    const body = collectIndented(lines, i);
    return {
      start: i,
      end: body.end,
      def: {
        name: py[1],
        params: splitParams(py[2]),
        body: body.lines,
      },
    };
  }

  if (!py && cLike && !/^(if|while|for|switch)$/.test(cLike[1])) {
    const name = cLike[1];
    const params = splitParams(cLike[2]);
    let startBody = i;
    let braceLine = i;
    if (cLike[3] === "{") {
      startBody = i;
    } else if (lines[i + 1]?.text === "{") {
      braceLine = i + 1;
      startBody = i + 1;
    } else {
      return null;
    }
    const end = findMatchingBrace(lines, braceLine);
    const body = lines.slice(startBody + (cLike[3] === "{" || lines[i + 1]?.text === "{" ? 1 : 0), end);
    const first = lines[startBody];
    const inner =
      cLike[3] === "{"
        ? stripInlineOpen(first, lines, i, end)
        : lines.slice(startBody + 1, end);
    return {
      start: i,
      end,
      def: { name, params, body: inner.length ? inner : body },
    };
  }

  return null;
}

function stripInlineOpen(
  first: SrcLine,
  lines: SrcLine[],
  i: number,
  end: number
): SrcLine[] {
  const after = first.text.replace(/^[^{]*\{\s*/, "");
  const rest = lines.slice(i + 1, end);
  if (!after || after === "}") return rest;
  return [{ ...first, text: after.replace(/\}\s*$/, "") }, ...rest].filter(
    (l) => l.text && l.text !== "}"
  );
}

function findMatchingBrace(lines: SrcLine[], braceLine: number): number {
  let depth = 0;
  for (let i = braceLine; i < lines.length; i++) {
    const t = lines[i].raw;
    for (const ch of t) {
      if (ch === "{") depth += 1;
      if (ch === "}") {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
  }
  throw new Error("Bloco sem fecha-chave `}` — o código ainda está incompleto.");
}

function collectIndented(
  lines: SrcLine[],
  headerIndex: number
): { lines: SrcLine[]; end: number } {
  const base = lines[headerIndex].indent;
  const body: SrcLine[] = [];
  let i = headerIndex + 1;
  let last = headerIndex;
  while (i < lines.length) {
    if (!lines[i].text) {
      i += 1;
      continue;
    }
    if (lines[i].indent <= base) break;
    body.push(lines[i]);
    last = i;
    i += 1;
  }
  return { lines: body, end: last };
}

function splitParams(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((p) => p.trim().replace(/^(?:int|Node\s*\*?|const|let|var)\s+/, ""))
    .filter(Boolean);
}

function parseCallLine(text: string, line: number): CallSite | null {
  const m = text.match(/^([A-Za-z_]\w*)\s*\((.*)\)\s*$/);
  if (!m) return null;
  if (/^(if|while|for|switch|return)$/.test(m[1])) return null;
  return { name: m[1], args: splitArgs(m[2]), line };
}

function splitArgs(raw: string): string[] {
  if (!raw.trim()) return [];
  const args: string[] = [];
  let cur = "";
  let depth = 0;
  for (const ch of raw) {
    if (ch === "(" || ch === "[") depth += 1;
    if (ch === ")" || ch === "]") depth -= 1;
    if (ch === "," && depth === 0) {
      args.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

class Runtime {
  structure: "stack" | "linkedList";
  items: number[] = [];
  nodes = new Map<string, ListNode>();
  head: string | null = null;
  nextId = 1;
  vars: Record<string, Value> = {};
  lastError: string | null = null;
  loopGuard = 0;

  constructor(structure: "stack" | "linkedList", seed: number[]) {
    this.structure = structure;
    if (structure === "stack") {
      this.items = [...seed];
      this.vars.topo = seed.length - 1;
    } else {
      let prev: string | null = null;
      for (const value of seed) {
        const id = this.createNode(value);
        if (!prev) this.head = id;
        else this.nodes.get(prev)!.next = id;
        prev = id;
      }
      this.vars.head = this.head;
    }
  }

  values(): number[] {
    if (this.structure === "stack") return [...this.items];
    const out: number[] = [];
    const seen = new Set<string>();
    let cur = this.head;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const node = this.nodes.get(cur);
      if (!node) break;
      out.push(node.value);
      cur = node.next;
    }
    return out;
  }

  snapshot(highlighted?: string[]): StructureSnapshot {
    if (this.structure === "stack") {
      return {
        nodes: this.items.map((value, i) => ({ id: String(i), value })),
        highlightedNodeIds: highlighted,
      };
    }
    const nodes: StructureSnapshot["nodes"] = [];
    const seen = new Set<string>();
    let cur = this.head;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const node = this.nodes.get(cur);
      if (!node) break;
      nodes.push({
        id: node.id,
        value: node.value,
        next: node.next ?? undefined,
      });
      cur = node.next;
    }
    return { nodes, highlightedNodeIds: highlighted };
  }

  createNode(value: number): string {
    const id = `n${this.nextId++}`;
    this.nodes.set(id, { id, value, next: null });
    return id;
  }

  invokeBuiltin(op: CodeOp, steps: Step[], line: number): void {
    const value =
      typeof this.vars.value === "number" ? this.vars.value : 0;
    if (this.structure === "stack") {
      if (op === "push") {
        this.items.push(value);
        this.vars.topo = this.items.length - 1;
        this.emit(steps, line, `push(${value})`, "done", String(this.items.length - 1), `topo = ${value}`);
      } else if (op === "pop") {
        if (this.items.length === 0) {
          this.emit(steps, line, "underflow", "compare", undefined, "underflow");
          return;
        }
        const removed = this.items.pop();
        this.vars.topo = this.items.length - 1;
        this.emit(steps, line, `pop() remove ${removed}`, "done", undefined, `${removed} saiu`);
      }
      return;
    }
    if (op === "insertAtHead") {
      const id = this.createNode(value);
      this.nodes.get(id)!.next = this.head;
      this.head = id;
      this.vars.head = id;
      this.emit(steps, line, `insertAtHead(${value})`, "done", id, `head = ${value}`);
    } else if (op === "insertAtTail") {
      const id = this.createNode(value);
      if (!this.head) {
        this.head = id;
        this.vars.head = id;
      } else {
        let cur = this.head;
        while (this.nodes.get(cur)?.next) cur = this.nodes.get(cur)!.next!;
        this.nodes.get(cur)!.next = id;
      }
      this.emit(steps, line, `insertAtTail(${value})`, "done", id, `${value} no fim`);
    } else if (op === "remove") {
      this.removeValue(value);
      this.emit(steps, line, `remove(${value})`, "done", this.head ?? undefined, `${value}`);
    }
  }

  removeValue(value: number): void {
    if (!this.head) return;
    if (this.nodes.get(this.head)?.value === value) {
      this.head = this.nodes.get(this.head)?.next ?? null;
      this.vars.head = this.head;
      return;
    }
    let cur = this.head;
    while (this.nodes.get(cur)?.next) {
      const nextId = this.nodes.get(cur)!.next!;
      if (this.nodes.get(nextId)?.value === value) {
        this.nodes.get(cur)!.next = this.nodes.get(nextId)!.next;
        return;
      }
      cur = nextId;
    }
  }

  execBlock(body: SrcLine[], steps: Step[]): "ok" | "return" | "error" {
    let i = 0;
    while (i < body.length) {
      const line = body[i];
      if (!line.text || line.text === "{" || line.text === "}") {
        i += 1;
        continue;
      }

      if (this.isControl(line.text, "while")) {
        const parsed = this.parseControl(line.text, "while");
        const { block, next } = this.controlBody(body, i, parsed.rest);
        let n = 0;
        while (this.truthy(this.evalExpr(parsed.cond))) {
          n += 1;
          if (n > 400) {
            this.lastError = "Loop infinito? O while passou de 400 voltas.";
            return "error";
          }
          const r = this.execBlock(block, steps);
          if (r !== "ok") return r;
        }
        i = next;
        continue;
      }

      if (this.isControl(line.text, "if")) {
        const parsed = this.parseControl(line.text, "if");
        const { block, next } = this.controlBody(body, i, parsed.rest);
        if (this.truthy(this.evalExpr(parsed.cond))) {
          const r = this.execBlock(block, steps);
          if (r !== "ok") return r;
        }
        i = next;
        continue;
      }

      const r = this.execStatementLine(line, steps);
      if (r !== "ok") return r;
      i += 1;
    }
    return "ok";
  }

  isControl(text: string, kw: "if" | "while"): boolean {
    return new RegExp(`^${kw}\\b`).test(text);
  }

  parseControl(text: string, kw: "if" | "while"): { cond: string; rest: string } {
    if (text.startsWith(`${kw} (` ) || text.startsWith(`${kw}(`)) {
      const start = text.indexOf("(");
      const end = matchParen(text, start);
      return {
        cond: text.slice(start + 1, end),
        rest: text.slice(end + 1).trim(),
      };
    }
    const colon = text.match(new RegExp(`^${kw}\\s+(.+):$`));
    if (colon) return { cond: colon[1], rest: ":" };
    const bare = text.match(new RegExp(`^${kw}\\s+(.+)$`));
    if (bare) return { cond: bare[1], rest: "" };
    throw new Error(`Não entendi o ${kw}.`);
  }

  controlBody(
    body: SrcLine[],
    i: number,
    rest: string
  ): { block: SrcLine[]; next: number } {
    if (rest === ":") {
      const collected = collectIndented(body, i);
      return { block: collected.lines, next: collected.end + 1 };
    }
    if (rest.startsWith("{")) {
      const inner = unwrapBraces(rest);
      if (inner !== null && countChar(rest, "{") === 1) {
        const stmts = splitStatements(inner).filter(Boolean);
        return {
          block: stmts.map((t) => ({ ...body[i], text: canonicalize(t) })),
          next: i + 1,
        };
      }
    }
    if (rest && rest !== "{") {
      return {
        block: [{ ...body[i], text: canonicalize(rest.replace(/^\{/, "").replace(/\}$/, "")) }],
        next: i + 1,
      };
    }
    if (body[i + 1]?.text === "{") {
      const end = findMatchingBrace(body, i + 1);
      return { block: body.slice(i + 2, end), next: end + 1 };
    }
    if (body[i + 1]) {
      return { block: [body[i + 1]], next: i + 2 };
    }
    return { block: [], next: i + 1 };
  }

  execStatementLine(line: SrcLine, steps: Step[]): "ok" | "return" | "error" {
    const parts = splitStatements(line.text);
    for (const part of parts) {
      const text = canonicalize(part);
      if (!text) continue;
      const r = this.execStatement(text, line, steps);
      if (r !== "ok") return r;
    }
    return "ok";
  }

  execStatement(
    text: string,
    line: SrcLine,
    steps: Step[]
  ): "ok" | "return" | "error" {
    if (text === "checarEspaco()" || text === "checarEspaco") {
      this.emit(steps, line.n, "Conferimos se há espaço.", "compare", undefined, "ok para inserir");
      return "ok";
    }
    if (text === "checarSeVazia()" || text === "checarSeVazia") {
      if (this.items.length === 0) {
        this.emit(steps, line.n, "Pilha vazia — underflow.", "compare", undefined, "underflow");
        return "return";
      }
      this.emit(steps, line.n, "A pilha não está vazia.", "compare", undefined, "não é underflow");
      return "ok";
    }
    if (text === "return" || text.startsWith("return ")) return "return";

    const assign = splitAssign(text);
    if (assign) {
      const value = this.evalExpr(assign.right);
      this.assignTarget(assign.left, value, steps, line);
      return "ok";
    }

    if (this.tryMethodCall(text, steps, line)) return "ok";

    try {
      this.evalExpr(text);
      return "ok";
    } catch {
      throw new Error(`Não sei executar: ${line.raw.trim() || text}`);
    }
  }

  tryMethodCall(text: string, steps: Step[], line: SrcLine): boolean {
    const m = text.match(/^(pilha|stack)\.([A-Za-z_]\w*)\((.*)\)$/);
    if (!m) return false;
    const method = m[2];
    const args = splitArgs(m[3]).map((a) => this.evalExpr(a));
    this.callArrayMethod(method, args, steps, line);
    return true;
  }

  callArrayMethod(
    method: string,
    args: Value[],
    steps: Step[],
    line: SrcLine
  ): void {
    const beforeTop = this.items[this.items.length - 1];
    if (method === "append" || method === "push" || method === "add" || method === "push_back") {
      const value = num(args[0]);
      this.items.push(value);
      this.vars.topo = this.items.length - 1;
      this.emit(
        steps,
        line.n,
        `${value} entra no topo.`,
        "done",
        String(this.items.length - 1),
        `novo topo = ${value}`
      );
      return;
    }
    if (method === "pop" || method === "pop_back") {
      if (this.items.length === 0) {
        this.emit(steps, line.n, "Underflow.", "compare", undefined, "underflow");
        return;
      }
      const removed = this.items.pop();
      this.vars.topo = this.items.length - 1;
      this.emit(steps, line.n, `${removed} saiu.`, "done", undefined, `${removed} saiu`);
      return;
    }
    if (method === "remove") {
      const i = num(args[0]);
      this.items.splice(i, 1);
      this.vars.topo = this.items.length - 1;
      this.emit(steps, line.n, `remove índice ${i}.`, "mutate", undefined, `remove ${i}`);
      return;
    }
    void beforeTop;
    throw new Error(`Método não suportado: pilha.${method}()`);
  }

  assignTarget(
    left: string,
    value: Value,
    steps: Step[],
    line: SrcLine
  ): void {
    const idx = left.match(/^(pilha|stack)\[(.+)\]$/);
    if (idx) {
      let i = num(this.evalExpr(idx[2]));
      if (i < 0) i = this.items.length + i;
      if (i === this.items.length) this.items.push(num(value));
      else if (i >= 0 && i < this.items.length) this.items[i] = num(value);
      else if (i === this.items.length) this.items.push(num(value));
      else throw new Error(`Índice ${i} fora da pilha.`);
      this.vars.topo = this.items.length - 1;
      this.emit(
        steps,
        line.n,
        `pilha[${i}] = ${value}`,
        "done",
        String(Math.min(i, this.items.length - 1)),
        `pilha[${i}] = ${value}`
      );
      return;
    }

    if (left === "pilha.length" || left === "stack.length") {
      const n = num(value);
      if (n < this.items.length) this.items = this.items.slice(0, n);
      this.vars.topo = this.items.length - 1;
      this.emit(steps, line.n, `tamanho da pilha = ${n}`, "done", undefined, `len = ${n}`);
      return;
    }

    if (left.includes(".")) {
      this.assignPath(left, value, steps, line);
      return;
    }

    this.vars[left] = value;
    if (left === "head") {
      this.head = value === null ? null : String(value);
      this.vars.head = this.head;
      this.emit(steps, line.n, `head → ${this.describe(value)}`, "mutate", this.head ?? undefined, `head = ${this.describe(value)}`);
      return;
    }
    if (left === "topo" && this.structure === "stack") {
      const topo = num(value);
      this.vars.topo = topo;
      if (topo + 1 < this.items.length) this.items = this.items.slice(0, Math.max(topo + 1, 0));
      this.emit(steps, line.n, `topo = ${topo}`, "mutate", undefined, `topo = ${topo}`);
      return;
    }
    if (left === "atual" || left === "novo") {
      this.emit(steps, line.n, `${left} = ${this.describe(value)}`, "traverse", typeof value === "string" ? value : undefined, `${left}`);
    }
  }

  assignPath(
    left: string,
    value: Value,
    steps: Step[],
    line: SrcLine
  ): void {
    const parts = left.split(".");
    const obj = this.evalExpr(parts[0]);
    if (typeof obj !== "string") throw new Error(`Não achei o nó ${parts[0]}.`);
    let node = this.nodes.get(obj);
    if (!node) throw new Error(`Nó ${obj} não existe.`);
    for (let p = 1; p < parts.length - 1; p++) {
      if (parts[p] !== "next" || !node.next) {
        throw new Error(`Caminho inválido: ${left}`);
      }
      node = this.nodes.get(node.next);
      if (!node) throw new Error(`Caminho inválido: ${left}`);
    }
    const field = parts[parts.length - 1];
    if (field === "next") {
      node.next = value === null ? null : String(value);
      this.emit(
        steps,
        line.n,
        `${parts[0]}.next → ${this.describe(value)}`,
        "mutate",
        node.id,
        `${node.value} → ${this.describe(value)}`
      );
      return;
    }
    if (field === "value") {
      node.value = num(value);
      this.emit(steps, line.n, `${parts[0]}.value = ${value}`, "mutate", node.id, `${value}`);
      return;
    }
    throw new Error(`Campo não suportado: ${field}`);
  }

  describe(value: Value): string {
    if (value === null) return "null";
    if (typeof value === "string") {
      const node = this.nodes.get(value);
      return node ? String(node.value) : value;
    }
    return String(value);
  }

  emit(
    steps: Step[],
    line: number,
    description: string,
    kind: Step["kind"],
    highlight?: string,
    callout?: string
  ): void {
    steps.push(
      createStep({
        lineHighlighted: line,
        description,
        snapshot: this.snapshot(highlight ? [highlight] : undefined),
        kind,
        callout,
      })
    );
  }

  truthy(v: Value): boolean {
    return v !== null && v !== false && v !== 0 && v !== "";
  }

  evalExpr(input: string): Value {
    const expr = input.trim();
    if (!expr) return null;
    const tokens = tokenize(expr);
    const parser = new ExprParser(tokens, this);
    const value = parser.parse();
    parser.expectEnd();
    return value;
  }
}

function unwrapBraces(rest: string): string | null {
  const t = rest.trim();
  if (!t.startsWith("{")) return null;
  const end = matchParenLike(t, 0, "{", "}");
  return t.slice(1, end).trim();
}

function countChar(s: string, ch: string): number {
  return [...s].filter((c) => c === ch).length;
}

function splitStatements(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "(" || ch === "{" || ch === "[") depth += 1;
    if (ch === ")" || ch === "}" || ch === "]") depth -= 1;
    if (ch === ";" && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function splitAssign(text: string): { left: string; right: string } | null {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[") depth += 1;
    if (ch === ")" || ch === "]") depth -= 1;
    if (depth === 0 && ch === "=" && text[i + 1] !== "=" && text[i - 1] !== "!" && text[i - 1] !== "<" && text[i - 1] !== ">") {
      return { left: text.slice(0, i).trim(), right: text.slice(i + 1).trim() };
    }
  }
  return null;
}

function matchParen(s: string, start: number): number {
  return matchParenLike(s, start, "(", ")");
}

function matchParenLike(s: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === open) depth += 1;
    else if (s[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("Parêntese ou chave sem fechar.");
}

function num(v: Value): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === null) return 0;
  throw new Error(`Esperava número, recebi ${v}.`);
}

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "end" };

function tokenize(expr: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (expr.startsWith("&&", i) || expr.startsWith("||", i) || expr.startsWith("==", i) || expr.startsWith("!=", i) || expr.startsWith("<=", i) || expr.startsWith(">=", i)) {
      tokens.push({ t: "op", v: expr.slice(i, i + 2) });
      i += 2;
      continue;
    }
    if ("+-*/()[].,!<>".includes(ch)) {
      tokens.push({ t: "op", v: ch });
      i += 1;
      continue;
    }
    if (/\d/.test(ch) || (ch === "-" && /\d/.test(expr[i + 1] ?? "") && tokens[tokens.length - 1]?.t === "op")) {
      const m = expr.slice(i).match(/^-?\d+(?:\.\d+)?/);
      if (!m) throw new Error("Número inválido.");
      tokens.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = expr.slice(i).match(/^[A-Za-z_]\w*/);
      if (!m) throw new Error("Identificador inválido.");
      tokens.push({ t: "id", v: m[0] });
      i += m[0].length;
      continue;
    }
    throw new Error(`Caractere inesperado: ${ch}`);
  }
  tokens.push({ t: "end" });
  return tokens;
}

class ExprParser {
  i = 0;
  constructor(
    private tokens: Tok[],
    private rt: Runtime
  ) {}

  peek(): Tok {
    return this.tokens[this.i] ?? { t: "end" };
  }

  eat(): Tok {
    const t = this.peek();
    this.i += 1;
    return t;
  }

  peekOp(): string | null {
    const t = this.peek();
    return t.t === "op" ? t.v : null;
  }

  eatOp(): string {
    const t = this.eat();
    if (t.t !== "op") throw new Error("Operador esperado.");
    return t.v;
  }

  expectEnd(): void {
    if (this.peek().t !== "end") {
      throw new Error("Expressão incompleta ou demais tokens.");
    }
  }

  parse(): Value {
    return this.parseOr();
  }

  parseOr(): Value {
    let left = this.parseAnd();
    while (this.peekOp() === "||") {
      this.eat();
      const right = this.parseAnd();
      left = this.rt.truthy(left) || this.rt.truthy(right);
    }
    return left;
  }

  parseAnd(): Value {
    let left = this.parseCmp();
    while (this.peekOp() === "&&") {
      this.eat();
      const right = this.parseCmp();
      left = this.rt.truthy(left) && this.rt.truthy(right);
    }
    return left;
  }

  parseCmp(): Value {
    let left = this.parseAdd();
    while (["==", "!=", "<", ">", "<=", ">="].includes(this.peekOp() ?? "")) {
      const op = this.eatOp();
      const right = this.parseAdd();
      if (op === "==") left = left === right || (left == null && right == null);
      else if (op === "!=") left = !(left === right || (left == null && right == null));
      else if (op === "<") left = num(left) < num(right);
      else if (op === ">") left = num(left) > num(right);
      else if (op === "<=") left = num(left) <= num(right);
      else left = num(left) >= num(right);
    }
    return left;
  }

  parseAdd(): Value {
    let left = this.parseUnary();
    while (this.peekOp() === "+" || this.peekOp() === "-") {
      const op = this.eatOp();
      const right = this.parseUnary();
      left = op === "+" ? num(left) + num(right) : num(left) - num(right);
    }
    return left;
  }

  parseUnary(): Value {
    if (this.peekOp() === "!") {
      this.eat();
      return !this.rt.truthy(this.parseUnary());
    }
    if (this.peekOp() === "-") {
      this.eat();
      return -num(this.parseUnary());
    }
    return this.parsePrimary();
  }

  parsePrimary(): Value {
    const tok = this.peek();
    if (tok.t === "num") {
      this.eat();
      return tok.v;
    }
    if (this.peekOp() === "(") {
      this.eat();
      const inner = this.parseOr();
      if (this.peekOp() !== ")") {
        throw new Error("Falta `)`.");
      }
      this.eat();
      return inner;
    }
    if (tok.t === "id") {
      this.eat();
      if (tok.v === "null" || tok.v === "undefined") return null;
      if (tok.v === "true") return true;
      if (tok.v === "false") return false;
      if (this.peekOp() === "(") {
        this.eat();
        const args = this.parseArgList();
        return this.callFn(tok.v, args);
      }
      return this.parseSuffix(tok.v);
    }
    throw new Error("Expressão inválida.");
  }

  parseSuffix(root: string): Value {
    let value: Value = this.resolveIdent(root);
    while (true) {
      if (this.peekOp() === "(") {
        throw new Error(`Chamada inválida em ${root}.`);
      }
      if (this.peekOp() === ".") {
        this.eat();
        const next = this.eat();
        if (next.t !== "id") throw new Error("Campo inválido.");
        if (this.peekOp() === "(") {
          this.eat();
          const args = this.parseArgList();
          value = this.callMethod(value, next.v, args);
          root = "";
          continue;
        }
        value = this.readField(value, next.v);
        continue;
      }
      if (this.peekOp() === "[") {
        this.eat();
        const index = this.parseOr();
        if (this.peekOp() !== "]") {
          throw new Error("Falta `]`.");
        }
        this.eat();
        value = this.readIndex(value, index, root);
        continue;
      }
      break;
    }
    return value;
  }

  parseArgList(): Value[] {
    const args: Value[] = [];
    if (this.peekOp() === ")") {
      this.eat();
      return args;
    }
    args.push(this.parseOr());
    while (this.peekOp() === ",") {
      this.eat();
      args.push(this.parseOr());
    }
    if (this.peekOp() !== ")") {
      throw new Error("Falta `)` na chamada.");
    }
    this.eat();
    return args;
  }

  resolveIdent(name: string): Value {
    if (name === "head") return this.rt.head;
    if (name === "pilha" || name === "stack") return "__array__";
    if (name in this.rt.vars) return this.rt.vars[name];
    throw new Error(`Variável desconhecida: ${name}`);
  }

  callFn(name: string, args: Value[]): Value {
    if (name === "len") {
      if (args[0] === "__array__") return this.rt.items.length;
      return num(args[0]);
    }
    if (name === "criarNo" || name === "criar_no") {
      return this.rt.createNode(num(args[0]));
    }
    throw new Error(`Função não suportada: ${name}()`);
  }

  callMethod(obj: Value, method: string, args: Value[]): Value {
    if (obj === "__array__") return this.arrayMethodAsExpr(method, args);
    throw new Error(`Método não suportado: ${method}()`);
  }

  arrayMethodAsExpr(method: string, args: Value[]): Value {
    if (method === "size" || method === "length") return this.rt.items.length;
    if (method === "empty" || method === "isEmpty") return this.rt.items.length === 0;
    if (method === "get") {
      let i = num(args[0]);
      if (i < 0) i = this.rt.items.length + i;
      return this.rt.items[i] ?? null;
    }
    if (method === "back") return this.rt.items[this.rt.items.length - 1] ?? null;
    throw new Error(`Método não suportado em expressão: ${method}()`);
  }

  readField(obj: Value, field: string): Value {
    if (obj === "__array__") {
      if (field === "length") return this.rt.items.length;
      throw new Error(`pilha.${field} não existe.`);
    }
    if (obj === null) return null;
    if (typeof obj !== "string") throw new Error(`Não tem campo ${field}.`);
    const node = this.rt.nodes.get(obj);
    if (!node) throw new Error("Nó inválido.");
    if (field === "next") return node.next;
    if (field === "value" || field === "val") return node.value;
    throw new Error(`Campo ${field} não existe no nó.`);
  }

  readIndex(obj: Value, index: Value, _root: string): Value {
    if (obj !== "__array__") throw new Error("Só a pilha aceita índice [].");
    let i = num(index);
    if (i < 0) i = this.rt.items.length + i;
    return this.rt.items[i] ?? null;
  }
}
