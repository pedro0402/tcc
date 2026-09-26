import { useMemo, useState } from "react";
import type { StructureType } from "../../engine/types";
import styles from "./Engagement.module.css";

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
}

const QUIZZES: Record<StructureType, QuizQuestion[]> = {
  stack: [
    {
      id: "stack-lifo",
      prompt: "Qual princípio organiza uma pilha?",
      options: ["FIFO", "LIFO", "aleatório", "ordenado por valor"],
      answerIndex: 1,
    },
    {
      id: "stack-underflow",
      prompt: "O que ocorre ao fazer pop em uma pilha vazia?",
      options: ["overflow", "underflow", "rotação", "nada especial"],
      answerIndex: 1,
    },
    {
      id: "stack-top",
      prompt: "Push e pop atuam em qual extremidade?",
      options: ["base", "meio", "topo", "qualquer posição"],
      answerIndex: 2,
    },
  ],
  linkedList: [
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
    },
    {
      id: "ll-head",
      prompt: "O ponteiro head aponta para:",
      options: [
        "o último nó",
        "o primeiro nó (ou null)",
        "sempre null",
        "o maior valor",
      ],
      answerIndex: 1,
    },
    {
      id: "ll-insert-head",
      prompt: "insertAtHead tem complexidade típica de:",
      options: ["O(n)", "O(n log n)", "O(1)", "O(n²)"],
      answerIndex: 2,
    },
  ],
};

interface QuizPanelProps {
  structureType: StructureType;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
}

export function QuizPanel({ structureType, onAnswer }: QuizPanelProps) {
  const questions = useMemo(() => QUIZZES[structureType], [structureType]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (index >= questions.length) {
    return (
      <div className={styles.box} aria-label="Quiz">
        <p className={styles.kicker}>Quiz</p>
        <p className={styles.ok}>Quiz concluído para esta estrutura.</p>
        {feedback ? <p className={styles.ok}>{feedback}</p> : null}
      </div>
    );
  }

  const question = questions[index];

  return (
    <div className={styles.box} aria-label="Quiz">
      <p className={styles.kicker}>
        Quiz {index + 1} de {questions.length}
      </p>
      <p className={styles.prompt}>{question.prompt}</p>
      <div className={styles.options}>
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            className={styles.option}
            onClick={() => {
              const correct = optionIndex === question.answerIndex;
              onAnswer(question.id, correct);
              setFeedback(
                correct ? "Correto!" : "Revise o conceito e tente a próxima."
              );
              setIndex((i) => i + 1);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {feedback ? <p className={styles.ok}>{feedback}</p> : null}
    </div>
  );
}
