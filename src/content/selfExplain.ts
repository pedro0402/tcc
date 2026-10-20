// Perguntas de autoexplicação, por operação. Depois de concluir uma operação,
// o aluno escreve em uma frase por que aquilo aconteceu e então compara com
// uma explicação-modelo. É reflexão (metacognição), não avaliação: a resposta
// é opcional e o texto fica só no navegador.
//
// A chave é o nome da operação (op.name), o mesmo nas três variantes de lista.
// Onde a variante muda a resposta, VARIANT_PROMPTS (abaixo) tem precedência.

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

// Onde a lista dupla ou a circular muda a resposta (custo ou ligações), a
// variante tem pergunta própria. Chave: "variante:operação".
const VARIANT_PROMPTS: Record<string, SelfExplainPrompt> = {
  "dupla:inserirInicio": {
    question: "Por que inserir no início da lista dupla mexeu em dois ponteiros da cabeça antiga?",
    model:
      "O novo nó aponta para a cabeça atual e a cabeça antiga passa a apontar de volta para ele (ant). Depois a cabeça vira o novo nó. Nada é percorrido: é tempo constante.",
  },
  "dupla:inserirFim": {
    question: "Por que inserir no fim da lista dupla não precisou percorrer a lista?",
    model:
      "A lista dupla guarda a cauda. O novo nó aponta para trás para a cauda, a cauda aponta para o novo e a cauda passa a ser ele. Tempo constante.",
  },
  "dupla:removerEm": {
    question: "Por que foi preciso religar dois ponteiros para tirar o nó da lista dupla?",
    model:
      "Cada nó é alcançado pelos dois lados. O anterior passa a apontar para o seguinte do alvo, e o seguinte passa a apontar de volta para o anterior. Só assim o alvo some nas duas direções.",
  },
  "dupla:removerValor": {
    question: "Depois de achar o valor, o que foi preciso religar?",
    model:
      "Ao achar o alvo, o anterior dele passa a apontar para o seguinte e o seguinte aponta de volta para o anterior. Se o laço chegasse ao fim (null) sem achar, nada mudaria.",
  },
  "circular:inserirInicio": {
    question: "Por que inserir no início da lista circular precisou dar a volta na lista?",
    model:
      "O último nó aponta para a cabeça, então ele precisa passar a apontar para o novo nó. Sem ponteiro para o fim, achar o último exige percorrer a lista: é O(n).",
  },
  "circular:inserirFim": {
    question: "Como o percurso soube que tinha chegado ao último nó da lista circular?",
    model:
      "Na circular ninguém aponta para null: o último é o nó cujo próximo é a cabeça. Achado, ele aponta para o novo nó, e o novo aponta para a cabeça, fechando o círculo.",
  },
  "circular:removerValor": {
    question: "Como a remoção soube que o valor não estava na lista circular?",
    model:
      "A busca compara nó a nó e para quando volta à cabeça, pois não há null no fim. Se der a volta sem achar, devolve -1 e nada é removido; achando, remove pela posição.",
  },
};

export function selfExplainFor(operation: string, variant?: string): SelfExplainPrompt | undefined {
  if (variant && variant !== "simples") return VARIANT_PROMPTS[`${variant}:${operation}`] ?? PROMPTS[operation];
  return PROMPTS[operation];
}
