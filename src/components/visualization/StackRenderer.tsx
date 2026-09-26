import type { StructureSnapshot } from "../../engine/types";
import styles from "./renderers.module.css";

interface StackRendererProps {
  snapshot: StructureSnapshot;
  callout?: string;
}

export function StackRenderer({ snapshot, callout }: StackRendererProps) {
  const nodes = snapshot.nodes;
  const highlighted = new Set(snapshot.highlightedNodeIds ?? []);
  const width = 560;
  const row = 52;
  const height = Math.max(340, nodes.length * row + 110);
  const x = 236;

  const activeIndex = nodes.findIndex((n) => highlighted.has(n.id));
  const visualActive =
    activeIndex >= 0 ? nodes.length - 1 - activeIndex : 0;
  const calloutY = 42 + visualActive * row + 22;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Visualização da pilha"
    >
      <text x={24} y={28} className={styles.legend}>
        O topo está em cima. Push empilha; pop desempilha.
      </text>
      {nodes.length === 0 ? (
        <text x={width / 2} y={height / 2} textAnchor="middle" className={styles.hint}>
          pilha vazia — underflow se fizer pop
        </text>
      ) : (
        <>
          <text x={x + 44} y={50} textAnchor="middle" className={styles.ptr}>
            top/{nodes.length - 1}
          </text>
          {[...nodes].reverse().map((node, i) => {
            const y = 62 + i * row;
            const active = highlighted.has(node.id);
            return (
              <g key={node.id}>
                <rect
                  x={x}
                  y={y}
                  width={88}
                  height={42}
                  rx={4}
                  className={active ? styles.boxActive : styles.box}
                />
                <text
                  x={x + 44}
                  y={y + 27}
                  textAnchor="middle"
                  className={styles.nodeValue}
                >
                  {node.value}
                </text>
              </g>
            );
          })}
          {callout ? (
            <g>
              <rect
                x={x + 100}
                y={calloutY}
                width={Math.max(120, callout.length * 8)}
                height={28}
                rx={4}
                className={styles.calloutBg}
              />
              <text
                x={x + 110}
                y={calloutY + 18}
                className={styles.calloutText}
              >
                {callout}
              </text>
            </g>
          ) : null}
        </>
      )}
    </svg>
  );
}
