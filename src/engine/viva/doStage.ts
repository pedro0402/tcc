// Estágio "Fazer": em vez de só prever, o aluno executa os passos.
//
// Em cada passo em que um ponteiro passa a apontar para outro nó, derivamos
// uma pergunta "para onde vai o ponteiro X?". O aluno responde clicando num nó
// (ou em "null"). As perguntas saem automaticamente da comparação entre passos
// consecutivos, sem precisar escrevê-las à mão para cada operação.

import type { Node, Op, Step } from "./engine";

export interface DoStep {
  /** Índice do passo (em op.steps) que esta pergunta revela. */
  stepIndex: number;
  /** Ponteiro que muda (ex.: "topo", "cabeca", "atual", "novo.prox"). */
  pointer: string;
  /** Resposta: id do nó de destino, ou null. */
  answerId: number | null;
  /** Enunciado curto. */
  question: string;
}

const valueOfId = (nodes: Node[], id: number | null): string => {
  if (id === null) return "null";
  const n = nodes.find((x) => x.id === id);
  return n ? `${n.value}` : "?";
};

/** Destino de cada ponteiro nomeado, por id de nó (ou null), num passo. */
function pointerTargets(step: Step): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [name, idx] of Object.entries(step.pointers)) {
    out[name] = idx === null ? null : (step.nodes[idx]?.id ?? null);
  }
  return out;
}

/**
 * Deriva as perguntas do estágio "Fazer" para uma operação: um ponto por passo
 * em que um ponteiro de referência passa a apontar para outro destino.
 * Ponteiros auxiliares de leitura (atual, anterior, alvo, ultimo, i) entram,
 * pois é justamente o percurso que o aluno precisa acompanhar.
 */
export function deriveDoSteps(op: Op): DoStep[] {
  const steps = op.steps;
  const out: DoStep[] = [];
  for (let i = 1; i < steps.length; i++) {
    const before = pointerTargets(steps[i - 1]);
    const after = pointerTargets(steps[i]);
    for (const [pointer, target] of Object.entries(after)) {
      const had = pointer in before;
      const changed = !had || before[pointer] !== target;
      if (!changed) continue;
      // Evita perguntar sobre ponteiros que só aparecem para sumir no mesmo passo.
      out.push({
        stepIndex: i,
        pointer,
        answerId: target,
        question: `Para onde "${pointer}" aponta agora?`,
      });
      // Uma pergunta por passo: a mais relevante é a primeira mudança.
      break;
    }
  }
  return out;
}

/** Texto do destino correto de uma pergunta "Fazer", para o feedback. */
export function doAnswerText(op: Op, step: DoStep): string {
  return valueOfId(op.steps[step.stepIndex].nodes, step.answerId);
}
