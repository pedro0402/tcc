// Catálogo de concepções equivocadas sobre pilhas e listas encadeadas.
//
// Ancorado nas dificuldades descritas na fundamentação do TCC (seção 3.4.1,
// Almadhoun e Parham-Mocello): confusão entre nó e ponteiro, significado de
// NULL, e a ordem de religação dos ponteiros em inserção e remoção.
//
// Os ids são estáveis: aparecem no log de eventos e no servidor. Cada
// alternativa errada de uma previsão aponta para um destes, e a explicação é
// mostrada ao aluno quando ele erra — feedback informativo, não só "errado".

export type MisconceptionId =
  | "no-vs-ponteiro"
  | "null-significado"
  | "ordem-religacao-insercao"
  | "ordem-religacao-remocao"
  | "circular-parada"
  | "circular-religar-cabeca"
  | "dupla-um-lado"
  | "lifo-vs-fifo"
  | "topo-antes-de-ligar";

export interface Misconception {
  id: MisconceptionId;
  /** Rótulo curto do engano, para listas de revisão e relatórios. */
  title: string;
  /** Explicação em uma ou duas frases, dita ao aluno quando ele erra. */
  explain: string;
}

export const MISCONCEPTIONS: Record<MisconceptionId, Misconception> = {
  "no-vs-ponteiro": {
    id: "no-vs-ponteiro",
    title: "Confundir o nó com o ponteiro para o nó",
    explain:
      "O ponteiro (topo, cabeça, atual) não é o nó: é uma referência que diz onde o nó está. Mover o ponteiro não cria nem apaga nós.",
  },
  "null-significado": {
    id: "null-significado",
    title: "Entender o que null significa",
    explain:
      "null não é um valor guardado no nó: é a ausência de próximo. Numa lista simples, prox = null marca o fim.",
  },
  "ordem-religacao-insercao": {
    id: "ordem-religacao-insercao",
    title: "Ordem de religação ao inserir",
    explain:
      "O nó novo precisa apontar para o resto da lista antes de o anterior apontar para ele. Religar na ordem errada faz perder todos os nós seguintes.",
  },
  "ordem-religacao-remocao": {
    id: "ordem-religacao-remocao",
    title: "Ordem de religação ao remover",
    explain:
      "Para remover, o nó anterior passa a apontar para o seguinte do alvo (anterior.prox = alvo.prox). Só anular o prox do alvo não o tira da lista.",
  },
  "circular-parada": {
    id: "circular-parada",
    title: "Condição de parada na lista circular",
    explain:
      "Numa lista circular nenhum prox é null, então um laço que espera null gira para sempre. A parada é voltar à cabeça (atual.prox == cabeca).",
  },
  "circular-religar-cabeca": {
    id: "circular-religar-cabeca",
    title: "Religar o último nó à cabeça",
    explain:
      "Ao inserir no início ou remover a cabeça de uma lista circular, o último nó precisa passar a apontar para a nova cabeça; senão o círculo se quebra.",
  },
  "dupla-um-lado": {
    id: "dupla-um-lado",
    title: "Religar os dois sentidos da lista dupla",
    explain:
      "Numa lista dupla, cada ligação tem volta: ao mexer no prox de um lado, o ant do outro também muda. Atualizar só um sentido deixa a lista inconsistente.",
  },
  "lifo-vs-fifo": {
    id: "lifo-vs-fifo",
    title: "Trocar LIFO por FIFO",
    explain:
      "A pilha é LIFO: sai primeiro quem entrou por último. Sair o primeiro que entrou seria FIFO, o comportamento de uma fila.",
  },
  "topo-antes-de-ligar": {
    id: "topo-antes-de-ligar",
    title: "Mover o topo antes de ligar o novo nó",
    explain:
      "No push, o novo nó precisa apontar para o topo atual antes de o topo virar o novo nó. Mover o topo primeiro perde a referência ao resto da pilha.",
  },
};

export function misconception(id: MisconceptionId): Misconception {
  return MISCONCEPTIONS[id];
}
