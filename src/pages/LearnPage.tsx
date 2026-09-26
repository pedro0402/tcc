import { ENGAGEMENT_TIPS, LIST_LESSON, STACK_LESSON } from "../content/lessons";
import { hrefFor } from "../routing/useHashRoute";
import styles from "./LearnPage.module.css";

export function LearnPage() {
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
