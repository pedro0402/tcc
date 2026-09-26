import { useMemo, useState } from "react";
import { getLocalProgress } from "../persistence/localProgress";
import { hrefFor } from "../routing/useHashRoute";
import styles from "./ProgressPage.module.css";

export function ProgressPage() {
  const [tick, setTick] = useState(0);
  const progress = useMemo(() => getLocalProgress(), [tick]);

  const quizTotal = progress.quizAttempts.length;
  const quizOk = progress.quizAttempts.filter((q) => q.isCorrect).length;
  const predTotal = progress.predictions.length;
  const predOk = progress.predictions.filter((p) => p.isCorrect).length;

  const recent = [...progress.completedOperations].slice(-8).reverse();

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>Seu ritmo</p>
        <h1>Progresso local</h1>
        <p className={styles.lead}>
          Operações concluídas, previsões e quizzes ficam neste navegador.
          Com login, também tentamos sincronizar com o servidor.
        </p>
      </header>

      <div className={styles.stats}>
        <article>
          <strong>{progress.completedOperations.length}</strong>
          <span>operações vistas até o fim</span>
        </article>
        <article>
          <strong>
            {predTotal ? Math.round((predOk / predTotal) * 100) : 0}%
          </strong>
          <span>
            acerto nas previsões ({predOk}/{predTotal || 0})
          </span>
        </article>
        <article>
          <strong>
            {quizTotal ? Math.round((quizOk / quizTotal) * 100) : 0}%
          </strong>
          <span>
            acerto no quiz ({quizOk}/{quizTotal || 0})
          </span>
        </article>
      </div>

      <section className={styles.list}>
        <h2>Últimas execuções</h2>
        {recent.length === 0 ? (
          <p className={styles.empty}>
            Ainda não há execuções.{" "}
            <a href={hrefFor("lab")}>Abra o laboratório</a> e complete um
            push ou uma inserção.
          </p>
        ) : (
          <ol>
            {recent.map((item, i) => (
              <li key={`${item.completedAt}-${i}`}>
                <span>
                  {item.structure === "stack" ? "Pilha" : "Lista"} · {item.operation}
                </span>
                <time dateTime={item.completedAt}>
                  {new Date(item.completedAt).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          className={styles.refresh}
          onClick={() => setTick((n) => n + 1)}
        >
          atualizar
        </button>
      </section>
    </div>
  );
}
