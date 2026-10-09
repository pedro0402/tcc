import type { Node, Step } from "../../engine/viva/engine";
import type { Links, ListKind } from "../../engine/viva/links";
import styles from "./viva.module.css";

export type { ListKind };

function pointersFor(step: Step, i: number) {
  return Object.entries(step.pointers).filter(([, v]) => v === i).map(([k]) => k);
}

/** Quando `onPick` existe, o nó vira um botão clicável (estágio Fazer). */
function Box({ n, step, idx, onPick }: { n: Node; step: Step; idx: number; onPick?: (nodeId: number) => void }) {
  const hl = step.highlight.includes(n.id);
  const rm = step.removing === n.id;
  const ptrs = pointersFor(step, idx);
  const cls = rm ? styles.nodeRm : hl ? styles.nodeHl : styles.node;
  const inner = (
    <>
      <span className={styles.nodeVal}>{n.value}</span>
      <span className={styles.nodeNext}>•</span>
    </>
  );
  return (
    <div className={styles.boxWrap}>
      <div className={styles.ptrRow}>
        {ptrs.map((p) => (
          <span key={p} className={styles.ptr}>{p}</span>
        ))}
      </div>
      {onPick ? (
        <button type="button" className={`${cls} ${styles.nodePick}`} onClick={() => onPick(n.id)} aria-label={`Escolher o nó ${n.value}`}>
          {inner}
        </button>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </div>
  );
}

/** Conector entre o nó i e o nó i+1, deduzido das ligações reais. */
function connector(links: Links, i: number, kind: ListKind): { glyph: string; partial: boolean } {
  const fwd = links.prox[i] === i + 1;
  if (kind === "dupla") {
    const back = links.ant?.[i + 1] === i;
    if (fwd && back) return { glyph: "⇄", partial: false };
    if (fwd) return { glyph: "→", partial: true };
    if (back) return { glyph: "←", partial: true };
    return { glyph: "·", partial: false };
  }
  return { glyph: fwd ? "→" : "·", partial: false };
}

/** Ponteiros que não cabem num conector entre vizinhos (apontam para longe ou para null). */
function strayTags(links: Links, nodes: Node[], i: number, kind: ListKind): string[] {
  const out: string[] = [];
  const last = nodes.length - 1;
  const p = links.prox[i];
  const tailEnd = i === last && (p === null || (kind === "circular" && p === 0));
  if (!tailEnd && p !== i + 1) out.push(`prox→${p === null ? "null" : nodes[p].value}`);
  if (links.ant) {
    const q = links.ant[i];
    if (!(i === 0 && q === null) && q !== i - 1) out.push(`ant→${q === null ? "null" : nodes[q].value}`);
  }
  return out;
}

function LinkedList({ step, kind, links, onPick }: { step: Step; kind: ListKind; links: Links; onPick?: (nodeId: number) => void }) {
  const nodes = step.nodes;
  const last = nodes.length - 1;
  const tailTarget = links.prox[last];
  const closed = kind === "circular" && tailTarget === 0;
  return (
    <div
      className={`${styles.listCol} ${styles.listColLinked}`}
      role={onPick ? undefined : "img"}
      aria-label={`Lista ${kind}: ${nodes.map((n) => n.value).join(", ")}`}
    >
      <div className={styles.listRow}>
        {kind === "dupla" && links.ant?.[0] === null && (
          <>
            <span className={styles.nullTag}>null</span>
            <span className={styles.arrow}>←</span>
          </>
        )}
        {nodes.map((n, i) => {
          const tags = strayTags(links, nodes, i, kind);
          const c = i < last ? connector(links, i, kind) : null;
          return (
            <div key={n.id} className={styles.listItem}>
              <div className={styles.linkCol}>
                <Box n={n} step={step} idx={i} onPick={onPick} />
                {tags.length > 0 && (
                  <div className={styles.linkTags}>
                    {tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {c ? (
                <span className={c.partial ? styles.arrowPartial : styles.arrow}>{c.glyph}</span>
              ) : closed ? (
                <span className={styles.arrow}>↩</span>
              ) : tailTarget === null ? (
                <>
                  <span className={styles.arrow}>→</span>
                  <span className={styles.nullTag}>null</span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      {closed && (
        <span className={styles.circularNote}>o último nó aponta de volta para a cabeça ({nodes[0].value})</span>
      )}
    </div>
  );
}

export function ListCanvas({ step, kind, onPick }: { step: Step | null; kind: ListKind; onPick?: (nodeId: number) => void }) {
  if (!step) return null;
  const nodes = step.nodes;
  const arrow = kind === "dupla" ? "⇄" : "→";
  if (!nodes.length) return <Empty text="cabeca → null" />;
  if (step.links) return <LinkedList step={step} kind={kind} links={step.links} onPick={onPick} />;
  return (
    <div className={styles.listCol} role={onPick ? undefined : "img"} aria-label={`Lista ${kind}: ${nodes.map((n) => n.value).join(", ")}`}>
      <div className={styles.listRow}>
        {nodes.map((n, i) => (
          <div key={n.id} className={styles.listItem}>
            <Box n={n} step={step} idx={i} onPick={onPick} />
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

export function StackCanvas({ step, onPick }: { step: Step | null; onPick?: (nodeId: number) => void }) {
  if (!step) return null;
  const nodes = step.nodes;
  return (
    <div className={styles.stackCol} role={onPick ? undefined : "img"} aria-label={`Pilha, do topo para a base: ${nodes.map((n) => n.value).join(", ") || "vazia"}`}>
      {!nodes.length && <Empty text="topo → null" />}
      <div className={styles.stackWell}>
        {nodes.map((n, i) => {
          const cell = step.removing === n.id ? styles.cellRm : step.highlight.includes(n.id) ? styles.cellHl : styles.cell;
          return (
            <div key={n.id} className={styles.stackRow}>
              <span className={styles.stackPtr}>{pointersFor(step, i).join(" ")}</span>
              {onPick ? (
                <button type="button" className={`${cell} ${styles.nodePick}`} onClick={() => onPick(n.id)} aria-label={`Escolher o nó ${n.value}`}>
                  {n.value}
                </button>
              ) : (
                <div className={cell}>{n.value}</div>
              )}
              <span className={styles.stackSpacer} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}
