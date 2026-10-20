import { useEffect, useId, useReducer, useRef } from "react";
import type { QuizQuestion, QuizSet } from "../../content/quiz";
import { correctCount, initialQuizState, isFinished, quizReducer } from "./quizReducer";
import styles from "./Engagement.module.css";

interface QuizPanelProps {
  set: QuizSet;
  /** Chamado uma vez por pergunta, na primeira resposta. */
  onAnswer: (question: QuizQuestion, choice: number, correct: boolean) => void;
}

/** Quiz de verificação: responde, vê o porquê, avança. Use `key={set.id}` para reiniciar ao trocar de conjunto. */
export function QuizPanel({ set, onAnswer }: QuizPanelProps) {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const promptId = useId();
  const nextRef = useRef<HTMLButtonElement>(null);
  const focusRef = useRef<HTMLParagraphElement>(null); // pergunta atual ou resumo final
  const lastIndex = useRef(state.index);
  const total = set.questions.length;
  const answered = state.selected !== null;

  // Ao mudar de pergunta (ou ir ao resultado / refazer), o botão que tinha o foco some:
  // leva o foco para o novo conteúdo, para quem usa teclado ou leitor de tela não se perder.
  useEffect(() => {
    if (lastIndex.current === state.index) return;
    lastIndex.current = state.index;
    focusRef.current?.focus();
  }, [state.index]);

  // Depois de responder, o foco vai para "Próxima": quem usa teclado segue sem procurar.
  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered, state.index]);

  if (isFinished(state, total)) {
    const ok = correctCount(state);
    const missed = set.questions.filter((_, i) => !state.results[i]);
    return (
      <div className={styles.box} role="group" aria-label={`Resultado do quiz: ${set.label}`}>
        <p className={styles.kicker}>Quiz · {set.label}</p>
        <p ref={focusRef} tabIndex={-1} className={styles.prompt}>
          {ok} de {total} corretas.
        </p>
        {missed.length > 0 ? (
          <div className={styles.review}>
            <p className={styles.reviewTitle}>Para rever</p>
            <ul>
              {missed.map((q) => (
                <li key={q.id}>
                  {q.prompt} <strong>{q.options[q.answerIndex]}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => dispatch({ type: "RESET" })}>
            Refazer
          </button>
        </div>
      </div>
    );
  }

  const q = set.questions[state.index];
  const lastQuestion = state.index === total - 1;
  const wasCorrect = answered && state.selected === q.answerIndex;

  return (
    <div className={styles.box} role="group" aria-labelledby={promptId}>
      <p className={styles.kicker}>
        Quiz · {set.label} · {state.index + 1} de {total}
      </p>
      <p id={promptId} ref={focusRef} tabIndex={-1} className={styles.prompt}>
        {q.prompt}
      </p>
      <div className={styles.options}>
        {q.options.map((option, i) => {
          const cls = !answered
            ? styles.option
            : i === q.answerIndex
              ? styles.optionOk
              : i === state.selected
                ? styles.optionBad
                : styles.optionDim;
          return (
            <button
              key={option}
              type="button"
              className={cls}
              disabled={answered}
              onClick={() => {
                if (answered) return;
                const correct = i === q.answerIndex;
                dispatch({ type: "ANSWER", choice: i, correct });
                onAnswer(q, i, correct);
              }}
            >
              {option}
              {answered && i === q.answerIndex ? <span className={styles.mark}> · correta</span> : null}
              {answered && i === state.selected && i !== q.answerIndex ? (
                <span className={styles.mark}> · sua resposta</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered ? (
          <p className={styles.feedback}>
            <strong className={wasCorrect ? styles.okText : styles.badText}>
              {wasCorrect ? "Correto." : "Não."}
            </strong>{" "}
            {q.explanation}
          </p>
        ) : null}
      </div>
      {answered ? (
        <div className={styles.actions}>
          <button ref={nextRef} type="button" className={styles.primary} onClick={() => dispatch({ type: "NEXT" })}>
            {lastQuestion ? "Ver resultado" : "Próxima"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
