// Roteiros fixos da escada de scaffolding, por estrutura.
//
// Observar: estado inicial + uma sequência de operações demonstradas (roteiro
//   fixo, o aluno não escolhe).
// Prever:   herda o estado final do Observar e demonstra novas operações, agora
//   pedindo previsões.
// Fazer:    estrutura vazia + uma meta a atingir operando livremente.
// Desafio:  estrutura vazia + meta, com limite de passos e tempo regressivo.
//
// Só pilha e lista. Para a lista, os roteiros usam a variante simples.

import type { Structure } from "../engine/viva/engine";
import type { OpSpec } from "../engine/viva/runOps";

export interface ScriptStep {
  spec: OpSpec;
  /** Frase dita durante a demonstração desta operação. */
  caption: string;
}

export interface ObserveScript {
  initial: number[];
  steps: ScriptStep[];
}

export interface Goal {
  prompt: string;
  target: number[];
  /** Operações liberadas para a atividade (undefined = todas). */
  allowed?: OpSpec["op"][];
}

export interface DesafioSpec extends Goal {
  maxSteps: number;
  seconds: number;
}

/* ----------------------------- OBSERVAR ----------------------------- */
const OBSERVE: Record<Structure, ObserveScript> = {
  linkedList: {
    initial: [11, 8, 3],
    steps: [
      { spec: { op: "insertTail", value: 4 }, caption: "Inserir no fim: percorremos até o último nó e ligamos o novo (4)." },
      { spec: { op: "insertTail", value: 5 }, caption: "De novo no fim: a lista cresce para a direita, chegando a 11, 8, 3, 4, 5." },
      { spec: { op: "removeValue", value: 8 }, caption: "Remover por valor: o nó anterior salta o 8, que sai da cadeia." },
    ],
  },
  stack: {
    initial: [7, 3],
    steps: [
      { spec: { op: "push", value: 9 }, caption: "push(9): o novo valor entra no topo." },
      { spec: { op: "push", value: 2 }, caption: "push(2): sempre no topo. O último a entrar fica por cima." },
      { spec: { op: "pop" }, caption: "pop: sai o do topo (2) — o último que entrou. Isto é LIFO." },
    ],
  },
};

/* ------------------------------ PREVER ------------------------------ */
// Operações demonstradas no Prever, sobre o estado herdado do Observar.
const PREVIEW: Record<Structure, ScriptStep[]> = {
  linkedList: [
    { spec: { op: "insertHead", value: 1 }, caption: "Inserir no início: tente prever quem passa a ser a cabeça." },
    { spec: { op: "removeAt", pos: 0 }, caption: "Remover a cabeça: preveja qual nó assume o início da lista." },
  ],
  stack: [
    { spec: { op: "push", value: 5 }, caption: "push(5): preveja onde o novo valor entra." },
    { spec: { op: "pop" }, caption: "pop: preveja qual valor sai." },
  ],
};

/* ------------------------------- FAZER ------------------------------- */
const FAZER: Record<Structure, Goal> = {
  linkedList: {
    prompt: "Monte a lista 10, 20, 30 inserindo no fim.",
    target: [10, 20, 30],
    allowed: ["insertHead", "insertTail", "insertAt", "removeAt", "removeValue"],
  },
  stack: {
    prompt: "Deixe a pilha com o topo 8, usando push e pop.",
    target: [8, 5],
    allowed: ["push", "pop"],
  },
};

/* ------------------------------ DESAFIO ------------------------------ */
const DESAFIO: Record<Structure, DesafioSpec> = {
  linkedList: {
    prompt: "Chegue à lista 5, 15, 25.",
    target: [5, 15, 25],
    maxSteps: 6,
    seconds: 60,
    allowed: ["insertHead", "insertTail", "insertAt", "removeAt", "removeValue"],
  },
  stack: {
    prompt: "Deixe a pilha como 9, 4 (topo 9).",
    target: [9, 4],
    maxSteps: 6,
    seconds: 60,
    allowed: ["push", "pop"],
  },
};

export const observeScript = (s: Structure): ObserveScript => OBSERVE[s];
export const previewScript = (s: Structure): ScriptStep[] => PREVIEW[s];
export const fazerGoal = (s: Structure): Goal => FAZER[s];
export const desafioSpec = (s: Structure): DesafioSpec => DESAFIO[s];
