// Identificadores estáveis das operações oferecidas pelo simulador.
// Independem do nome exibido (op.name), que está em português e pode mudar.

export type StackOpId = "push" | "pop" | "peek" | "isEmpty";
export type ListOpId =
  | "insertHead"
  | "insertTail"
  | "insertAt"
  | "removeAt"
  | "removeValue"
  | "search";
export type OpId = StackOpId | ListOpId;

export const STACK_OPS: StackOpId[] = ["push", "pop", "peek", "isEmpty"];
export const LIST_OPS: ListOpId[] = [
  "insertHead",
  "insertTail",
  "insertAt",
  "removeAt",
  "removeValue",
  "search",
];
