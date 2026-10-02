import { LivePreview } from "../components/home/LivePreview";
import { hrefFor } from "../routing/useHashRoute";
import styles from "./HomePage.module.css";

const STEPS = [
  {
    n: "01",
    title: "Visualize",
    text: "Acompanhe nós, ponteiros e valores mudando na tela.",
  },
  {
    n: "02",
    title: "Entenda o código",
    text: "Cada linha é destacada no momento em que acontece.",
  },
  {
    n: "03",
    title: "Teste seu raciocínio",
    text: "Preveja o próximo passo antes de continuar a execução.",
  },
];

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Aprender fazendo</p>
          <h1 className={styles.title}>
            Estruturas de dados em <span className={styles.accent}>movimento.</span>
          </h1>
          <p className={styles.lead}>
            Veja listas encadeadas e pilhas mudarem passo a passo enquanto o
            código acompanha cada operação.
          </p>
          <div className={styles.actions}>
            <a className={styles.cta} href={hrefFor("lab")}>
              <svg className={styles.playIcon} viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
              Começar a aprender
            </a>
            <span className={styles.actionNote}>Gratuito e direto no navegador</span>
          </div>
        </div>

        <PreviewCard />
      </section>

      <section className={styles.steps} aria-label="Como funciona">
        {STEPS.map((step) => (
          <article key={step.n} className={styles.step}>
            <header className={styles.stepHead}>
              <span className={styles.stepIcon} aria-hidden="true">
                {step.n === "01" ? (
                  <svg viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h8" /></svg>
                ) : step.n === "02" ? (
                  <svg viewBox="0 0 24 24"><path d="m8 6-5 6 5 6M16 6l5 6-5 6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M4 5h16v11H4zM9 20h6M12 16v4" /></svg>
                )}
              </span>
              <span className={styles.stepNum}>{step.n}</span>
            </header>
            <h2 className={styles.stepTitle}>{step.title}</h2>
            <p className={styles.stepText}>{step.text}</p>
          </article>
        ))}
      </section>

      <section className={styles.closer}>
        <div>
          <p className={styles.closerKicker}>Lista encadeada · Pilha</p>
          <h2 className={styles.closerTitle}>Pronto para ver a teoria ganhar vida?</h2>
        </div>
        <a className={styles.closerLink} href={hrefFor("lab")}>
          Explorar estruturas
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </section>
    </div>
  );
}

function PreviewCard() {
  return (
    <a className={styles.preview} href={`${hrefFor("lab")}?s=list`} aria-label="Abrir o simulador da lista encadeada">
      <LivePreview />
    </a>
  );
}
