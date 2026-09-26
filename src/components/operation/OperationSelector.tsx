import type { StructureType } from "../../engine/types";
import styles from "./OperationSelector.module.css";

export type StackOperation = "push" | "pop";
export type LinkedListOperation = "insertAtHead" | "insertAtTail" | "remove";
export type OperationId = StackOperation | LinkedListOperation;

interface OperationSelectorProps {
  structureType: StructureType;
  operation: OperationId;
  onStructureChange: (structure: StructureType) => void;
  onOperationChange: (operation: OperationId) => void;
}

const STACK_OPS: { id: StackOperation; label: string; hint: string }[] = [
  { id: "push", label: "push", hint: "inserir no topo" },
  { id: "pop", label: "pop", hint: "remover o topo" },
];

const LIST_OPS: { id: LinkedListOperation; label: string; hint: string }[] = [
  { id: "insertAtHead", label: "insertAtHead", hint: "início da lista" },
  { id: "insertAtTail", label: "insertAtTail", hint: "fim da lista" },
  { id: "remove", label: "remove", hint: "por valor" },
];

export function OperationSelector({
  structureType,
  operation,
  onStructureChange,
  onOperationChange,
}: OperationSelectorProps) {
  const ops = structureType === "stack" ? STACK_OPS : LIST_OPS;

  return (
    <div className={styles.wrap}>
      <div className={styles.group} role="group" aria-label="Estrutura">
        <span className={styles.label}>Estrutura</span>
        <div className={styles.chips}>
          <button
            type="button"
            className={structureType === "stack" ? styles.chipOn : styles.chip}
            onClick={() => {
              onStructureChange("stack");
              onOperationChange("push");
            }}
          >
            Pilha
          </button>
          <button
            type="button"
            className={
              structureType === "linkedList" ? styles.chipOnAmber : styles.chip
            }
            onClick={() => {
              onStructureChange("linkedList");
              onOperationChange("insertAtHead");
            }}
          >
            Lista
          </button>
        </div>
      </div>

      <div className={styles.group} role="group" aria-label="Operação">
        <span className={styles.label}>Operação</span>
        <div className={styles.chips}>
          {ops.map((op) => (
            <button
              key={op.id}
              type="button"
              className={operation === op.id ? styles.chipOn : styles.chip}
              onClick={() => onOperationChange(op.id)}
              title={op.hint}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
