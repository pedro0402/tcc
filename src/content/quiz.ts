// Banco de perguntas de verificação. Os ids são estáveis: aparecem no log de
// eventos e no servidor, então não devem ser renomeados nem reaproveitados.

export type QuizStructure = "stack" | "linkedList";
export type QuizVariant = "simples" | "dupla" | "circular";

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Por que a resposta certa é a certa (e o que a errada costuma confundir). */
  explanation: string;
}

export interface QuizSet {
  id: string;
  label: string;
  structure: QuizStructure;
  variant?: QuizVariant;
  questions: QuizQuestion[];
}

export const QUIZ_SETS: QuizSet[] = [
  {
    id: "pilha",
    label: "Pilha",
    structure: "stack",
    questions: [
      {
        id: "stack-lifo",
        prompt: "Qual princípio organiza uma pilha?",
        options: ["FIFO", "LIFO", "aleatório", "ordenado por valor"],
        answerIndex: 1,
        explanation: "LIFO (Last In, First Out): o último elemento inserido é o primeiro a sair.",
      },
      {
        id: "stack-top",
        prompt: "Push e pop atuam em qual extremidade?",
        options: ["base", "meio", "topo", "qualquer posição"],
        answerIndex: 2,
        explanation: "Toda inserção e remoção acontece no topo. Por isso as duas operações são rápidas, sem percorrer a pilha.",
      },
      {
        id: "stack-underflow",
        prompt: "O que ocorre ao fazer pop em uma pilha vazia?",
        options: ["overflow", "underflow", "rotação", "nada especial"],
        answerIndex: 1,
        explanation: "Remover de uma pilha vazia é um underflow. Por isso o pop confere topo == null antes de remover.",
      },
      {
        id: "stack-peek",
        prompt: "Qual operação lê o elemento do topo sem removê-lo?",
        options: ["pop", "peek", "push", "isEmpty"],
        answerIndex: 1,
        explanation: "peek (ou top) só consulta. O pop devolve o valor e também tira o nó da pilha.",
      },
      {
        id: "stack-order",
        prompt: "Depois de push(1), push(2) e push(3), qual valor sai no primeiro pop?",
        options: ["1", "2", "3", "depende do tamanho"],
        answerIndex: 2,
        explanation: "O 3 foi o último a entrar, então é o primeiro a sair. Quem responde 1 está pensando em FIFO.",
      },
      {
        id: "stack-push-link",
        prompt: "No push, qual ligação é feita antes de mover o topo?",
        options: ["novo.prox = topo", "topo.prox = novo", "topo = null", "tamanho = 0"],
        answerIndex: 0,
        explanation:
          "O novo nó primeiro aponta para o topo atual; só depois o topo passa a ser o novo nó. Mover o topo antes faria perder a referência aos elementos antigos.",
      },
    ],
  },
  {
    id: "lista-simples",
    label: "Lista simples",
    structure: "linkedList",
    variant: "simples",
    questions: [
      {
        id: "ll-next",
        prompt: "Em uma lista simplesmente encadeada, cada nó guarda:",
        options: [
          "apenas o valor",
          "valor e referência ao próximo",
          "valor e dois filhos",
          "apenas o índice",
        ],
        answerIndex: 1,
        explanation: "Cada nó tem o valor e o prox, a referência para o nó seguinte. É o prox que forma a sequência.",
      },
      {
        id: "ll-head",
        prompt: "O ponteiro head (cabeça) aponta para:",
        options: ["o último nó", "o primeiro nó (ou null)", "sempre null", "o maior valor"],
        answerIndex: 1,
        explanation: "A cabeça é a porta de entrada: aponta para o primeiro nó, ou para null quando a lista está vazia.",
      },
      {
        id: "ll-null",
        prompt: "Numa lista simples, o que significa um prox igual a null?",
        options: [
          "o nó guarda o valor zero",
          "o nó é o último da lista",
          "o nó foi removido",
          "o nó é a cabeça",
        ],
        answerIndex: 1,
        explanation: "null no prox marca o fim da lista. Não é um valor guardado no nó: é a ausência de próximo.",
      },
      {
        id: "ll-insert-head",
        prompt: "inserirInicio tem complexidade típica de:",
        options: ["O(n)", "O(n log n)", "O(1)", "O(n²)"],
        answerIndex: 2,
        explanation: "Só cria um nó e mexe em dois ponteiros, sem percorrer a lista: tempo constante.",
      },
      {
        id: "ll-tail-cost",
        prompt: "Numa lista simples que guarda só a cabeça, inserirFim custa:",
        options: ["O(1)", "O(n)", "O(log n)", "depende do valor"],
        answerIndex: 1,
        explanation: "Sem ponteiro para o fim, é preciso percorrer a lista inteira até o último nó. Quanto mais nós, mais passos.",
      },
      {
        id: "ll-insert-order",
        prompt: "Ao inserir no meio, qual ligação deve vir primeiro?",
        options: ["novo.prox = atual.prox", "atual.prox = novo", "cabeca = novo", "atual = null"],
        answerIndex: 0,
        explanation:
          "Se atual.prox = novo vier antes, ninguém mais aponta para o resto da lista e ele se perde. Primeiro o novo nó aponta para o seguinte.",
      },
      {
        id: "ll-remove",
        prompt: "Para remover um nó do meio, o nó anterior passa a apontar para:",
        options: [
          "o próximo do nó removido",
          "null",
          "a cabeça",
          "ele mesmo",
        ],
        answerIndex: 0,
        explanation: "O anterior “pula” o alvo: anterior.prox = alvo.prox. O alvo deixa de ser alcançável.",
      },
    ],
  },
  {
    id: "lista-dupla",
    label: "Lista dupla",
    structure: "linkedList",
    variant: "dupla",
    questions: [
      {
        id: "dl-ant",
        prompt: "O que cada nó de uma lista dupla guarda, além do valor?",
        options: ["só prox", "prox e ant", "só ant", "dois valores"],
        answerIndex: 1,
        explanation: "prox aponta para o próximo e ant para o anterior. Por isso dá para andar nos dois sentidos.",
      },
      {
        id: "dl-tail-cost",
        prompt: "Com ponteiro para a cauda, inserirFim na lista dupla custa:",
        options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        answerIndex: 0,
        explanation: "A cauda já está à mão: basta ligar o novo nó a ela. Não é preciso percorrer a lista.",
      },
      {
        id: "dl-both",
        prompt: "Ao inserir um nó no meio, quantos ponteiros dos vizinhos precisam mudar?",
        options: ["nenhum", "um", "dois", "todos os nós"],
        answerIndex: 2,
        explanation:
          "Dois: o prox do vizinho da esquerda e o ant do vizinho da direita. Esquecer um deles deixa a lista inconsistente.",
      },
      {
        id: "dl-remove-prev",
        prompt: "Por que remover um nó não exige uma variável “anterior” na lista dupla?",
        options: [
          "o próprio nó guarda o ant",
          "porque só remove a cabeça",
          "porque usa recursão",
          "porque percorre a lista de trás para frente",
        ],
        answerIndex: 0,
        explanation: "Com alvo.ant já se chega ao vizinho da esquerda. Na lista simples seria preciso carregar o anterior durante o percurso.",
      },
    ],
  },
  {
    id: "lista-circular",
    label: "Lista circular",
    structure: "linkedList",
    variant: "circular",
    questions: [
      {
        id: "cl-last",
        prompt: "Numa lista circular com vários nós, para onde aponta o prox do último?",
        options: ["null", "a cabeça", "o penúltimo nó", "o próprio último nó"],
        answerIndex: 1,
        explanation: "O último volta para a cabeça, fechando o círculo. Em lugar nenhum da lista aparece null.",
      },
      {
        id: "cl-stop",
        prompt: "Numa lista circular, o laço “enquanto atual.prox != null” termina?",
        options: [
          "sim, como na lista simples",
          "não: nenhum prox é null",
          "só se houver um nó",
          "só na remoção",
        ],
        answerIndex: 1,
        explanation: "Nenhum prox é null, então o laço nunca para. A condição certa compara com a cabeça: atual.prox != cabeca.",
      },
      {
        id: "cl-single",
        prompt: "Numa lista circular com um único nó, para onde aponta o prox desse nó?",
        options: ["null", "para ele mesmo", "para um nó anterior", "para o próximo da lista"],
        answerIndex: 1,
        explanation: "Com um nó só, o “último” e a cabeça são o mesmo nó. Então ele aponta para si.",
      },
      {
        id: "cl-insert-head",
        prompt: "Por que inserir no início de uma lista circular simples exige chegar até o último nó?",
        options: [
          "o último precisa apontar para a nova cabeça",
          "para apagar a cabeça antiga",
          "para ordenar os valores",
          "para contar o tamanho",
        ],
        answerIndex: 0,
        explanation: "O último nó ainda aponta para a cabeça antiga. Sem religá-lo à nova cabeça, o círculo se quebra.",
      },
    ],
  },
];

export function quizSetById(id: string): QuizSet | undefined {
  return QUIZ_SETS.find((s) => s.id === id);
}
