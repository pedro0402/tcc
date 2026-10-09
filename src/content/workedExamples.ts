// Exemplos resolvidos: uma demonstração comentada que pausa nos passos-chave
// antes de o aluno operar sozinho. É o primeiro degrau da escada (Figura 1 do
// TCC) e um exemplo trabalhado no sentido da Teoria da Carga Cognitiva: o aluno
// observa um caso completo e explicado antes de tentar.
//
// Os comentários são casados pela LINHA do código (op.code), que é estável por
// operação, em vez do índice do passo, que varia com o tamanho da estrutura.
// Mostramos o comentário na PRIMEIRA vez que a linha-chave aparece.

import type { Op } from "../engine/viva/engine";

/** Comentário de um passo-chave: a linha do código e o texto didático. */
export interface ExampleNote {
  /** Índice da linha em op.code que dispara o comentário. */
  line: number;
  text: string;
}

// Comentários por operação (op.name). Nem toda linha vira comentário: só as
// decisões que valem a pena destacar.
const NOTES: Record<string, ExampleNote[]> = {
  push: [
    { line: 2, text: "O novo nó aponta para o topo atual antes de qualquer outra coisa. Assim não perdemos o resto da pilha." },
    { line: 3, text: "Só agora o topo passa a ser o novo nó. É isto que faz o último a entrar ficar no topo (LIFO)." },
  ],
  pop: [
    { line: 1, text: "Primeiro conferimos se a pilha está vazia: remover de uma pilha vazia é underflow." },
    { line: 4, text: "O topo avança para o próximo nó. O nó removido deixa de ser alcançável." },
  ],
  inserirInicio: [
    { line: 2, text: "O novo nó aponta para a cabeça atual. Ligamos antes de mudar a cabeça." },
    { line: 3, text: "A cabeça passa a ser o novo nó. Nenhuma volta pela lista foi necessária: é O(1)." },
  ],
  inserirFim: [
    { line: 4, text: "Enquanto houver próximo, seguimos andando: numa lista simples é preciso chegar ao último nó." },
    { line: 6, text: "Só no fim ligamos o último nó ao novo. É o que torna inserir no fim mais caro que no início." },
  ],
  inserirEm: [
    { line: 6, text: "Primeiro o novo nó aponta para o resto (novo.prox = atual.prox)." },
    { line: 7, text: "Depois o anterior aponta para o novo. Inverter esta ordem perderia os nós seguintes." },
  ],
  removerEm: [
    { line: 5, text: "Guardamos o alvo: o nó que vai sair da cadeia." },
    { line: 6, text: "O anterior salta o alvo, apontando para o seguinte dele. Sem ninguém apontando, o alvo some da lista." },
  ],
  removerValor: [
    { line: 4, text: "Percorremos comparando os valores até achar (ou chegar ao fim)." },
    { line: 7, text: "Ao achar, o anterior salta o alvo. É a mesma religação da remoção por posição." },
  ],
  buscar: [
    { line: 3, text: "Em cada passo comparamos o valor atual com o procurado." },
    { line: 6, text: "Se o laço termina sem achar, a busca devolve -1." },
  ],
};

/** A operação tem exemplo resolvido? */
export function hasWorkedExample(op: Op): boolean {
  return (NOTES[op.name]?.length ?? 0) > 0;
}

/**
 * Índice do primeiro passo em que cada linha-chave aparece, com seu comentário.
 * É aí que a demonstração deve pausar. Linhas que não ocorrem na operação atual
 * (por exemplo, o ramo "lista vazia") são simplesmente ignoradas.
 */
export function keyStepsFor(op: Op): Array<{ stepIndex: number; text: string }> {
  const notes = NOTES[op.name];
  if (!notes) return [];
  const out: Array<{ stepIndex: number; text: string }> = [];
  for (const note of notes) {
    const stepIndex = op.steps.findIndex((s) => s.line === note.line);
    if (stepIndex >= 0) out.push({ stepIndex, text: note.text });
  }
  // Em ordem de aparição, sem repetir o mesmo passo.
  return out.sort((a, b) => a.stepIndex - b.stepIndex).filter((v, i, arr) => i === 0 || v.stepIndex !== arr[i - 1].stepIndex);
}
