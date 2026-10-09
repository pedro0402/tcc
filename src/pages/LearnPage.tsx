import { useCallback, useState } from "react";
import { syncQuizToApi } from "../api/progressClient";
import { QuizPanel } from "../components/engagement/QuizPanel";
import { ENGAGEMENT_TIPS, LIST_LESSON, STACK_LESSON } from "../content/lessons";
import { QUIZ_SETS, quizSetById, type QuizQuestion } from "../content/quiz";
import { recordQuizAttempt } from "../persistence/localProgress";
import { hrefFor } from "../routing/useHashRoute";
import styles from "./LearnPage.module.css";

export function LearnPage() {
  const [quizId, setQuizId] = useState(QUIZ_SETS[0].id);
  const quizSet = quizSetById(quizId) ?? QUIZ_SETS[0];

  const onQuizAnswer = useCallback(
    (q: QuizQuestion, _choice: number, correct: boolean) => {
      recordQuizAttempt(q.id, correct, { structure: quizSet.structure, variant: quizSet.variant });
      void syncQuizToApi(q.id, correct);
    },
    [quizSet],
  );

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>Guia rápido</p>
        <h1>O que você está vendo no laboratório</h1>
        <p>
          Estruturas de dados são processos, não fotos. Aqui o código e o
          desenho andam juntos para reduzir a carga de ficar reconstruindo tudo
          na cabeça.
        </p>
      </header>

      <div className={styles.split}>
        <article className={styles.lesson}>
          <span className={styles.tag}>{STACK_LESSON.badge}</span>
          <h2>{STACK_LESSON.title}</h2>
          <p>{STACK_LESSON.lead}</p>
          <ul>
            {STACK_LESSON.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a href={`${hrefFor("lab")}?s=stack`}>Praticar pilha →</a>
        </article>
        <article className={styles.lessonAmber}>
          <span className={styles.tagAmber}>{LIST_LESSON.badge}</span>
          <h2>{LIST_LESSON.title}</h2>
          <p>{LIST_LESSON.lead}</p>
          <ul>
            {LIST_LESSON.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a href={`${hrefFor("lab")}?s=list`}>Praticar lista →</a>
        </article>
      </div>

      <section className={styles.quiz} aria-labelledby="quiz-title">
        <h2 id="quiz-title">Verificar entendimento</h2>
        <div className={styles.setTabs} role="group" aria-label="Estrutura do quiz">
          {QUIZ_SETS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === quizSet.id}
              className={s.id === quizSet.id ? styles.setOn : styles.set}
              onClick={() => setQuizId(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <QuizPanel key={quizSet.id} set={quizSet} onAnswer={onQuizAnswer} />
      </section>

      <section className={styles.tips}>
        <h2>Como estudar de verdade</h2>
        <div className={styles.tipGrid}>
          {ENGAGEMENT_TIPS.map((tip) => (
            <article key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
