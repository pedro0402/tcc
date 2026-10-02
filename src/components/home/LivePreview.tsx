import { HOME_LIVE_SCRIPT } from "../../engine/demo/scripts";
import { nodeMap, pointersOn, type DemoFrame, type DemoScript } from "../../engine/demo/types";
import { useDemoLoop } from "../../engine/demo/useDemoLoop";
import styles from "./LivePreview.module.css";

interface LivePreviewProps {
  script?: DemoScript;
}

export function LivePreview({ script = HOME_LIVE_SCRIPT }: LivePreviewProps) {
  const { frame, line, code, kind } = useDemoLoop(script);

  return (
    <>
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>Visualização ao vivo</p>
          <p className={styles.op}>{script.title}</p>
        </div>
        <span className={styles.dot} aria-hidden="true" />
      </header>

      <div className={styles.stage} aria-hidden="true">
        {kind === "stack" ? <StackDemo frame={frame} /> : <LinkedListDemo frame={frame} />}
      </div>

      <pre className={styles.code}>
        {code.map((src, i) => (
          <span key={i} className={i === line ? styles.codeOn : styles.codeDim}>
            {src}
          </span>
        ))}
      </pre>
    </>
  );
}

function LinkedListDemo({ frame }: { frame: DemoFrame }) {
  const byId = nodeMap(frame);
  const incoming = new Set(frame.incomingIds ?? []);
  const chain = frame.order.map((id) => byId.get(id)).filter((n) => n && !incoming.has(n.id));
  const detached = (frame.incomingIds ?? []).map((id) => byId.get(id)).filter(Boolean);
  const joining = frame.connecting?.to;
  const drawingFrom = frame.connecting?.from;

  return (
    <div className={styles.list}>
      <div className={styles.row}>
        {chain.map((node, i) => {
          if (!node) return null;
          const next = chain[i + 1];
          const drawsToNext = Boolean(next && drawingFrom === node.id && joining === next.id);
          const danglingNull = !next && drawingFrom !== node.id;
          return (
            <span key={node.id} className={styles.item}>
              <Cell
                names={pointersOn(frame, node.id)}
                value={node.value}
                active={frame.highlight.includes(node.id)}
                appear={joining === node.id}
              />
              {next ? (
                <span className={drawsToNext ? styles.arrowDraw : styles.arrow}>→</span>
              ) : danglingNull ? (
                <span className={styles.nullTag}>null</span>
              ) : null}
            </span>
          );
        })}
        {chain.length === 0 ? <span className={styles.nullTag}>null</span> : null}
      </div>

      <div className={styles.incoming}>
        {detached.map((node) => {
          if (!node) return null;
          const toNull = frame.connecting?.from === node.id && frame.connecting.to === null;
          return (
            <span key={node.id} className={styles.item}>
              <Cell names={pointersOn(frame, node.id)} value={node.value} active appear />
              <span className={toNull ? styles.arrowDraw : styles.arrow}>→</span>
              <span className={styles.nullTag}>null</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StackDemo({ frame }: { frame: DemoFrame }) {
  const byId = nodeMap(frame);
  const incoming = new Set(frame.incomingIds ?? []);
  const cells = frame.order.map((id) => byId.get(id)).filter((n) => n && !incoming.has(n.id));
  const detached = (frame.incomingIds ?? []).map((id) => byId.get(id)).filter(Boolean);

  return (
    <div className={styles.stack}>
      {detached.map((node) =>
        node ? (
          <Cell key={node.id} names={pointersOn(frame, node.id)} value={node.value} active appear />
        ) : null,
      )}
      {cells.map((node) =>
        node ? (
          <Cell
            key={node.id}
            names={pointersOn(frame, node.id)}
            value={node.value}
            active={frame.highlight.includes(node.id)}
            appear={frame.connecting?.to === node.id}
          />
        ) : null,
      )}
      {cells.length === 0 && detached.length === 0 ? (
        <span className={styles.nullTag}>topo → null</span>
      ) : null}
    </div>
  );
}

function Cell({
  names,
  value,
  active,
  appear,
}: {
  names: string[];
  value: number | string;
  active?: boolean;
  appear?: boolean;
}) {
  const cls = [styles.node, active ? styles.nodeActive : "", appear ? styles.nodeAppear : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={styles.cell}>
      <span className={styles.ptrRow}>
        {names.length ? names.map((n) => (
          <span key={n} className={styles.ptr}>
            {n}
          </span>
        )) : (
          <span className={styles.ptrGhost} />
        )}
      </span>
      <span className={cls}>{value}</span>
    </span>
  );
}
