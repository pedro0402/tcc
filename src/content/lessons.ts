export const STACK_LESSON = {
  title: "Pilha",
  badge: "LIFO",
  lead: "O último elemento a entrar é o primeiro a sair. Todas as mudanças acontecem no topo.",
  points: [
    "push cria um nó, liga novo.prox ao topo atual e move o topo — tempo constante.",
    "pop remove o topo — e falha com underflow se a pilha estiver vazia.",
    "peek consulta o topo sem remover; isEmpty verifica se topo == null.",
  ],
};

export const LIST_LESSON = {
  title: "Lista encadeada",
  badge: "nós + prox",
  lead: "Cada nó guarda um valor e uma referência para o próximo. A cabeça é a porta de entrada.",
  points: [
    "inserirInicio cria um nó e aponta novo.prox para a cabeça atual.",
    "inserirFim e inserirEm percorrem a lista antes de religar os ponteiros.",
    "removerEm e removerValor fazem anterior.prox pular o nó alvo.",
  ],
};

export const ENGAGEMENT_TIPS = [
  {
    title: "Observe o código e o desenho juntos",
    text: "A linha destacada é o que está acontecendo agora. Relacione-a com o nó iluminado.",
  },
  {
    title: "Controle o ritmo",
    text: "Avance passo a passo até o modelo mental ficar claro. Depois use o play.",
  },
  {
    title: "Preveja o próximo estado",
    text: "Com o modo previsão ligado, a plataforma pausa antes dos passos-chave e pergunta o que vem a seguir.",
  },
];
