// Perguntas de autoexplicação, por operação. Depois de concluir uma operação,
// o aluno escreve em uma frase por que aquilo aconteceu e então compara com
// uma explicação-modelo. É reflexão (metacognição), não avaliação: a resposta
// é opcional e o texto fica só no navegador.
//
// A chave é o nome da operação (op.name), que é o mesmo nas três variantes de
// lista (inserirInicio, inserirFim, etc.).

export interface SelfExplainPrompt {
  /** Pergunta curta, dirigida ao que mudou de estado. */
  question: string;
  /** Resposta de referência, mostrada para contraste depois que o aluno escreve. */
  model: string;
}

const PROMPTS: Record<string, SelfExplainPrompt> = {
  push: {
    question: "Por que o novo valor foi parar no topo, e não no fim da pilha?",
    model:
      "O push liga o novo nó ao topo atual e move o topo para ele. Toda inserção acontece no topo, por isso o último a entrar fica no topo (LIFO).",
  },
  pop: {
    question: "Por que o pop devolveu justamente esse valor?",
    model:
      "O pop age no topo: lê o valor do topo e faz o topo avançar para o próximo. Sai quem entrou por último.",
  },
  inserirInicio: {
    question: "Por que inserir no início não precisou percorrer a lista?",
    model:
      "O novo nó aponta para a cabeça atual e vira a nova cabeça. Como mexemos só na frente, não é preciso andar pela lista: é tempo constante.",
  },
  inserirFim: {
    question: "O que foi preciso fazer para chegar até o fim da lista?",
    model:
      "Numa lista simples, sem ponteiro para o fim, percorremos nó a nó até o último (prox = null) e só então ligamos o novo nó. Na lista dupla, a cauda evita esse percurso.",
  },
  inserirEm: {
    question: "Por que o novo nó foi ligado ao resto antes de o anterior apontar para ele?",
    model:
      "Primeiro novo.prox recebe o próximo do atual; só depois atual.prox passa a ser o novo. Na ordem inversa, perderíamos a referência ao resto da lista.",
  },
  removerEm: {
    question: "Por que religar o ponteiro anterior tira o nó da lista?",
    model:
      "O anterior passa a apontar para o seguinte do alvo, pulando-o. Sem ninguém apontando para ele, o nó deixa de fazer parte da cadeia.",
  },
  removerValor: {
    question: "Como a busca soube onde parar antes de remover?",
    model:
      "Percorremos comparando cada valor; ao achar o alvo, religamos o anterior ao seguinte dele. Se chegássemos ao fim sem achar, nada mudaria.",
  },
  buscar: {
    question: "O que determinou o valor devolvido pela busca?",
    model:
      "A busca devolve a posição do primeiro nó com o valor procurado, ou -1 se percorrer tudo sem encontrar.",
  },
};

export function selfExplainFor(operation: string): SelfExplainPrompt | undefined {
  return PROMPTS[operation];
}
