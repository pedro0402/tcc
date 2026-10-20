import * as E from "./engine";
import type { Node, Op } from "./engine";
import type { ListKind } from "./links";
import { dInsertAt, dInsertHead, dInsertTail, dRemoveAt, dRemoveValue, dSearch } from "./dlist";
import { cInsertAt, cInsertHead, cInsertTail, cRemoveAt, cRemoveValue, cSearch } from "./clist";

/** As seis operações de lista, na variante escolhida. */
export interface ListOps {
  insertHead(list: Node[], value: number): Op;
  insertTail(list: Node[], value: number): Op;
  insertAt(list: Node[], pos: number, value: number): Op;
  removeAt(list: Node[], pos: number): Op;
  removeValue(list: Node[], value: number): Op;
  search(list: Node[], value: number): Op;
}

const simple = (op: Op): Op => ({ ...op, variant: "simples" });

const SIMPLES: ListOps = {
  insertHead: (l, v) => simple(E.listInsertHead(l, v)),
  insertTail: (l, v) => simple(E.listInsertTail(l, v)),
  insertAt: (l, p, v) => simple(E.listInsertAt(l, p, v)),
  removeAt: (l, p) => simple(E.listRemoveAt(l, p)),
  removeValue: (l, v) => simple(E.listRemoveValue(l, v)),
  search: (l, v) => simple(E.listSearch(l, v)),
};

const DUPLA: ListOps = {
  insertHead: dInsertHead,
  insertTail: dInsertTail,
  insertAt: dInsertAt,
  removeAt: dRemoveAt,
  removeValue: dRemoveValue,
  search: dSearch,
};

const CIRCULAR: ListOps = {
  insertHead: cInsertHead,
  insertTail: cInsertTail,
  insertAt: cInsertAt,
  removeAt: cRemoveAt,
  removeValue: cRemoveValue,
  search: cSearch,
};

export function listOps(kind: ListKind): ListOps {
  return kind === "dupla" ? DUPLA : kind === "circular" ? CIRCULAR : SIMPLES;
}
