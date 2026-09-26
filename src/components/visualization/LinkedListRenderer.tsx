import type { StructureSnapshot } from "../../engine/types";
import styles from "./renderers.module.css";

interface LinkedListRendererProps {
  snapshot: StructureSnapshot;
  callout?: string;
}

export function LinkedListRenderer({
  snapshot,
  callout,
}: LinkedListRendererProps) {
  const nodes = snapshot.nodes;
  const highlighted = new Set(snapshot.highlightedNodeIds ?? []);
  const r = 22;
  const gap = 86;
  const width = Math.max(640, nodes.length * gap + 120);
  const cy = 120;

  const activeIndex = Math.max(
    0,
    nodes.findIndex((n) => highlighted.has(n.id))
  );
  const calloutX = 48 + activeIndex * gap;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} 240`}
      role="img"
      aria-label="Visualização da lista encadeada"
    >
      <text x={24} y={28} className={styles.legend}>
        Cada seta é um next. O head é a porta de entrada.
      </text>
      {nodes.length === 0 ? (
        <text x={width / 2} y={130} textAnchor="middle" className={styles.hint}>
          head → null
        </text>
      ) : (
        nodes.map((node, index) => {
          const cx = 48 + index * gap;
          const active = highlighted.has(node.id);
          const isHead = index === 0;
          const isTail = index === nodes.length - 1;
          return (
            <g key={node.id}>
              {index < nodes.length - 1 ? (
                <>
                  <line
                    x1={cx + r}
                    y1={cy}
                    x2={cx + gap - r - 6}
                    y2={cy}
                    className={styles.edge}
                  />
                  <polygon
                    points={`${cx + gap - r - 6},${cy} ${cx + gap - r - 16},${cy - 6} ${cx + gap - r - 16},${cy + 6}`}
                    className={styles.arrow}
                  />
                </>
              ) : (
                <text x={cx + r + 8} y={cy + 4} className={styles.hint}>
                  null
                </text>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                className={active ? styles.circleActive : styles.circle}
              />
              <text
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                className={styles.value}
              >
                {node.value}
              </text>
              {isHead ? (
                <text x={cx} y={cy + r + 18} textAnchor="middle" className={styles.ptr}>
                  head/{index}
                </text>
              ) : null}
              {isTail ? (
                <text
                  x={cx}
                  y={isHead ? cy + r + 34 : cy + r + 18}
                  textAnchor="middle"
                  className={styles.ptr}
                >
                  tail/{index}
                </text>
              ) : null}
            </g>
          );
        })
      )}
      {callout && nodes.length > 0 ? (
        <g>
          <rect
            x={Math.max(8, calloutX - 40)}
            y={42}
            width={Math.max(130, callout.length * 8)}
            height={28}
            rx={4}
            className={styles.calloutBg}
          />
          <text
            x={Math.max(18, calloutX - 30)}
            y={60}
            className={styles.calloutText}
          >
            {callout}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
