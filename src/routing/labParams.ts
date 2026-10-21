import type { Structure } from "../engine/viva/engine";
import type { ListKind } from "../engine/viva/links";
import { hrefFor, type RouteParams } from "./useHashRoute";

// Parâmetros do simulador no hash: s = estrutura, k = tipo de lista.
// Ex.: #/lab?s=list&k=dupla, #/lab?s=stack.

export interface LabTarget {
  structure: Structure;
  kind: ListKind;
}

const KINDS: ListKind[] = ["simples", "dupla", "circular"];

export function parseLabParams(params: RouteParams): LabTarget {
  const structure: Structure = params.s === "stack" ? "stack" : "linkedList";
  const kind = KINDS.includes(params.k as ListKind) ? (params.k as ListKind) : "simples";
  return { structure, kind: structure === "stack" ? "simples" : kind };
}

/** Link para o simulador já na estrutura (e tipo de lista) escolhidos. */
export function labHref(structure: Structure, kind: ListKind = "simples"): string {
  if (structure === "stack") return hrefFor("lab", { s: "stack" });
  return hrefFor("lab", { s: "list", k: kind === "simples" ? "" : kind });
}

/** Nome da estrutura como aparece ao usuário. */
export function labLabel({ structure, kind }: LabTarget): string {
  if (structure === "stack") return "Pilha";
  return kind === "simples" ? "Lista simples" : kind === "dupla" ? "Lista dupla" : "Lista circular";
}
