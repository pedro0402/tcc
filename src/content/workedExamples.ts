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

// Comentários por operação (op.name) da pilha e da lista simples. Nem toda
// linha vira comentário: só as decisões que valem a pena destacar.
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

// A lista dupla e a circular têm código próprio (outras linhas e outro custo),
// então têm comentários próprios. Chave: "variante:operação".
const VARIANT_NOTES: Record<string, ExampleNote[]> = {
  "dupla:inserirInicio": [
    { line: 2, text: "O novo nó aponta para a cabeça atual. Ligamos antes de mudar a cabeça." },
    { line: 3, text: "Na lista dupla também existe o caminho de volta: a cabeça antiga passa a apontar para trás, para o novo nó." },
    { line: 5, text: "A cabeça passa a ser o novo nó. Nenhuma volta pela lista foi necessária: é O(1)." },
  ],
  "dupla:inserirFim": [
    { line: 2, text: "O novo nó aponta para trás, para a cauda atual." },
    { line: 3, text: "A cauda antiga passa a apontar para frente, para o novo nó." },
    { line: 5, text: "A cauda vira o novo nó. Com o ponteiro cauda, inserir no fim não percorre a lista: é O(1)." },
  ],
  "dupla:inserirEm": [
    { line: 6, text: "Primeiro o novo nó aponta para frente, para o resto da lista (novo.prox = atual.prox)." },
    { line: 7, text: "E para trás, para atual (novo.ant = atual)." },
    { line: 8, text: "O nó seguinte passa a apontar de volta para o novo." },
    { line: 9, text: "Só por último atual aponta para o novo. Fazer isso antes perderia o acesso ao nó seguinte." },
  ],
  "dupla:removerEm": [
    { line: 2, text: "Avançamos alvo até a posição. Não precisamos de um ponteiro 'anterior': o próprio alvo sabe quem vem antes (alvo.ant)." },
    { line: 3, text: "O anterior do alvo passa a pular o alvo, apontando para o seguinte dele." },
    { line: 5, text: "O seguinte do alvo aponta de volta para o anterior. Com as duas direções religadas, o alvo sai da lista." },
  ],
  "dupla:removerValor": [
    { line: 2, text: "Percorremos comparando os valores até achar (ou chegar ao fim)." },
    { line: 5, text: "Ao achar, o anterior do alvo passa a pular o alvo." },
    { line: 7, text: "E o seguinte do alvo aponta de volta para o anterior: as duas direções ficam religadas." },
  ],
  // Mesmo código da lista simples (percurso só para frente).
  "dupla:buscar": NOTES.buscar,

  "circular:inserirInicio": [
    { line: 4, text: "Na circular o último nó aponta para a cabeça, e não há cauda: para achá-lo é preciso dar a volta. Por isso aqui inserir no início é O(n)." },
    { line: 6, text: "O novo nó aponta para a cabeça atual." },
    { line: 7, text: "O último nó passa a apontar para o novo, mantendo o círculo fechado." },
    { line: 8, text: "A cabeça passa a ser o novo nó." },
  ],
  "circular:inserirFim": [
    { line: 4, text: "Procuramos o último nó: é o que aponta de volta para a cabeça (na circular não existe null no fim)." },
    { line: 6, text: "O último passa a apontar para o novo." },
    { line: 7, text: "O novo nó fecha o círculo apontando para a cabeça." },
  ],
  // Mesmo código da lista simples: o laço já dá a volta sozinho.
  "circular:inserirEm": NOTES.inserirEm,
  "circular:removerEm": [
    { line: 7, text: "Removendo a cabeça: o último nó passa a apontar para a nova cabeça, fechando o círculo de novo." },
    { line: 10, text: "anterior começa na cabeça e anda até o nó que fica antes do alvo." },
    { line: 13, text: "O anterior pula o alvo, apontando para o seguinte dele. O círculo continua fechado, sem o alvo." },
  ],
  "circular:removerValor": [
    { line: 1, text: "Primeiro buscamos a posição do valor, dando no máximo uma volta na lista." },
    { line: 3, text: "Achado o valor, removemos pela posição: é a mesma religação de removerEm." },
  ],
  "circular:buscar": [
    { line: 4, text: "Em cada passo comparamos o valor atual com o procurado." },
    { line: 6, text: "Na circular não há null no fim: o laço para quando voltamos à cabeça. Sem achar, a busca devolve -1." },
  ],
};

/** Comentários da operação na variante dela (lista simples e pilha usam NOTES). */
function notesFor(op: Op): ExampleNote[] | undefined {
  if (op.variant && op.variant !== "simples") return VARIANT_NOTES[`${op.variant}:${op.name}`];
  return NOTES[op.name];
}

/** A operação tem exemplo resolvido? */
export function hasWorkedExample(op: Op): boolean {
  return (notesFor(op)?.length ?? 0) > 0;
}

/**
 * Índice do primeiro passo em que cada linha-chave aparece, com seu comentário.
 * É aí que a demonstração deve pausar. Linhas que não ocorrem na operação atual
 * (por exemplo, o ramo "lista vazia") são simplesmente ignoradas.
 */
export function keyStepsFor(op: Op): Array<{ stepIndex: number; text: string }> {
  const notes = notesFor(op);
  if (!notes) return [];
  const out: Array<{ stepIndex: number; text: string }> = [];
  for (const note of notes) {
    const stepIndex = op.steps.findIndex((s) => s.line === note.line);
    if (stepIndex >= 0) out.push({ stepIndex, text: note.text });
  }
  // Em ordem de aparição, sem repetir o mesmo passo.
  return out.sort((a, b) => a.stepIndex - b.stepIndex).filter((v, i, arr) => i === 0 || v.stepIndex !== arr[i - 1].stepIndex);
}
