// Fluxo do quiz sem React: responder, ver o feedback, avançar.

export interface QuizState {
  /** Pergunta atual (0-based). Igual ao total quando o quiz terminou. */
  index: number;
  /** Alternativa escolhida na pergunta atual; null enquanto não respondeu. */
  selected: number | null;
  /** Resultado por pergunta já respondida, na ordem. */
  results: boolean[];
}

export const initialQuizState: QuizState = { index: 0, selected: null, results: [] };

export type QuizAction =
  | { type: "ANSWER"; choice: number; correct: boolean }
  | { type: "NEXT" }
  | { type: "RESET" };

export function quizReducer(s: QuizState, a: QuizAction): QuizState {
  switch (a.type) {
    case "ANSWER":
      // Só vale a primeira resposta de cada pergunta.
      if (s.selected !== null) return s;
      return { ...s, selected: a.choice, results: [...s.results, a.correct] };
    case "NEXT":
      // Só avança depois de responder.
      if (s.selected === null) return s;
      return { ...s, index: s.index + 1, selected: null };
    case "RESET":
      return initialQuizState;
  }
}

export const isFinished = (s: QuizState, total: number) => s.index >= total;
export const correctCount = (s: QuizState) => s.results.filter(Boolean).length;
