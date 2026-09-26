import type { ReactNode } from "react";
import styles from "./AppShell.module.css";

interface AppShellProps {
  lesson: ReactNode;
  toolbar: ReactNode;
  code: ReactNode;
  visualization: ReactNode;
  description: ReactNode;
  stepMeta?: ReactNode;
  controls: ReactNode;
  engagement?: ReactNode;
}

export function AppShell({
  lesson,
  toolbar,
  code,
  visualization,
  description,
  stepMeta,
  controls,
  engagement,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.top}>
        {lesson}
        <section className={styles.toolbar} aria-label="Operação">
          {toolbar}
        </section>
      </div>

      <section className={styles.workspace} aria-label="Código e visualização">
        <div className={styles.pane}>
          <header className={styles.paneHead}>Código</header>
          {code}
        </div>
        <div className={styles.pane}>
          <header className={styles.paneHead}>Estrutura</header>
          {visualization}
        </div>
      </section>

      <div className={styles.narration}>
        {stepMeta}
        <p className={styles.description} aria-live="polite">
          {description}
        </p>
      </div>

      <section className={styles.controls} aria-label="Controles de execução">
        {controls}
      </section>

      {engagement ? (
        <section className={styles.engagement} aria-label="Engajamento">
          {engagement}
        </section>
      ) : null}
    </div>
  );
}
