import type { Node, Step } from "../../engine/viva/engine";
import styles from "./viva.module.css";

export type ListKind = "simples" | "dupla" | "circular";

function pointersFor(step: Step, i: number) {
  return Object.entries(step.pointers).filter(([, v]) => v === i).map(([k]) => k);
}

function Box({ n, step, idx }: { n: Node; step: Step; idx: number }) {
  const hl = step.highlight.includes(n.id);
  const rm = step.removing === n.id;
  const ptrs = pointersFor(step, idx);
  return (
    <div className={styles.boxWrap}>
      <div className={styles.ptrRow}>
        {ptrs.map((p) => (
          <span key={p} className={styles.ptr}>{p}</span>
        ))}
      </div>
      <div className={rm ? styles.nodeRm : hl ? styles.nodeHl : styles.node}>
        <span className={styles.nodeVal}>{n.value}</span>
        <span className={styles.nodeNext}>•</span>
      </div>
    </div>
  );
}

export function ListCanvas({ step, kind }: { step: Step | null; kind: ListKind }) {
  if (!step) return null;
  const nodes = step.nodes;
  const arrow = kind === "dupla" ? "⇄" : "→";
  if (!nodes.length) return <Empty text="cabeca → null" />;
  return (
    <div className={styles.listCol} role="img" aria-label={`Lista ${kind}: ${nodes.map((n) => n.value).join(", ")}`}>
      <div className={styles.listRow}>
        {nodes.map((n, i) => (
          <div key={n.id} className={styles.listItem}>
            <Box n={n} step={step} idx={i} />
            <span className={styles.arrow}>
              {i < nodes.length - 1 ? arrow : kind === "circular" ? "↩" : "→"}
            </span>
            {i === nodes.length - 1 && kind !== "circular" && <span className={styles.nullTag}>null</span>}
          </div>
        ))}
      </div>
      {kind === "circular" && (
        <span className={styles.circularNote}>o último nó aponta de volta para a cabeça ({nodes[0].value})</span>
      )}
    </div>
  );
}

export function StackCanvas({ step }: { step: Step | null }) {
  if (!step) return null;
  const nodes = step.nodes;
  return (
    <div className={styles.stackCol} role="img" aria-label={`Pilha, do topo para a base: ${nodes.map((n) => n.value).join(", ") || "vazia"}`}>
      {!nodes.length && <Empty text="topo → null" />}
      <div className={styles.stackWell}>
        {nodes.map((n, i) => (
          <div key={n.id} className={styles.stackRow}>
            <span className={styles.stackPtr}>{pointersFor(step, i).join(" ")}</span>
            <div className={step.removing === n.id ? styles.cellRm : step.highlight.includes(n.id) ? styles.cellHl : styles.cell}>
              {n.value}
            </div>
            <span className={styles.stackSpacer} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}
