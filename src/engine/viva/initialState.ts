import { mk, type Node } from "./engine";

export const MAX_INITIAL_NODES = 8;

export type ParseResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string };

/**
 * Interpreta o texto do estado inicial (ex.: "3, 8, 15" ou "3 8 15").
 * Aceita vazio (estrutura vazia). Só inteiros, no máximo MAX_INITIAL_NODES.
 */
export function parseInitialState(text: string): ParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, values: [] };

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length > MAX_INITIAL_NODES) {
    return { ok: false, error: `No máximo ${MAX_INITIAL_NODES} valores.` };
  }

  const values: number[] = [];
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return { ok: false, error: `"${token}" não é um número inteiro.` };
    }
    const n = Number(token);
    if (!Number.isSafeInteger(n)) return { ok: false, error: `"${token}" é grande demais.` };
    values.push(n);
  }
  return { ok: true, values };
}

/** Texto que representa um estado atual (para preencher o editor). */
export function nodesToText(nodes: Node[]): string {
  return nodes.map((n) => n.value).join(", ");
}

/** Cria os nós a partir de valores já validados. */
export function nodesFromValues(values: number[]): Node[] {
  return values.map(mk);
}
