import type { Op } from "../viva/engine";
import type { DemoFrame, DemoScript, DemoStructureKind } from "./types";

const KIND: Record<Op["structure"], DemoStructureKind> = {
  stack: "stack",
  linkedList: "linkedList",
};

function nodeId(id: number) {
  return String(id);
}

/**
 * Adapta uma operação do motor do lab para o player de demonstração.
 * Passos extra (incoming / connecting) são inferidos da diferença entre frames.
 */
export function scriptFromOp(
  op: Op,
  meta: { id: string; title: string; holdMs?: number },
): DemoScript {
  let prev = new Set<string>();

  const frames: DemoFrame[] = op.steps.map((step, i) => {
    const nodes = step.nodes.map((n) => ({ id: nodeId(n.id), value: n.value }));
    const order = nodes.map((n) => n.id);
    const current = new Set(order);
    const incomingIds = i === 0 ? [] : order.filter((id) => !prev.has(id));

    let connecting: DemoFrame["connecting"];
    if (incomingIds.length === 1) {
      const neu = incomingIds[0];
      const idx = order.indexOf(neu);
      if (idx > 0) connecting = { from: order[idx - 1], to: neu };
      else if (idx === 0 && order.length > 1) connecting = { from: neu, to: order[1] };
    }

    const pointers: Record<string, string | null> = {};
    for (const [name, index] of Object.entries(step.pointers)) {
      pointers[name] = index == null ? null : order[index] ?? null;
    }

    const frame: DemoFrame = {
      id: `${op.name}-${i}`,
      line: step.line,
      nodes,
      order,
      pointers,
      highlight: step.highlight.map(nodeId),
      incomingIds: incomingIds.length ? incomingIds : undefined,
      connecting,
      removingIds: step.removing != null ? [nodeId(step.removing)] : undefined,
    };
    prev = current;
    return frame;
  });

  return {
    id: meta.id,
    kind: KIND[op.structure],
    title: meta.title,
    code: op.code,
    frames,
    holdMs: meta.holdMs ?? 1400,
  };
}
