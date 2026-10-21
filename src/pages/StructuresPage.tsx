import type { ListKind } from "../engine/viva/links";
import { labHref } from "../routing/labParams";
import styles from "./StructuresPage.module.css";

const LIST_KINDS: Array<{ kind: ListKind; title: string; text: string }> = [
  {
    kind: "simples",
    title: "Lista simples",
    text: "Cada nó aponta só para o próximo. O ponto de partida: cabeça, percurso e religação.",
  },
  {
    kind: "dupla",
    title: "Lista dupla",
    text: "Cada nó aponta para o próximo e para o anterior. Com a cauda, inserir no fim é imediato.",
  },
  {
    kind: "circular",
    title: "Lista circular",
    text: "O último nó aponta de volta para a cabeça. Não existe null no fim: o percurso para ao voltar.",
  },
];

/** Escolha da estrutura antes de entrar no simulador. */
export function StructuresPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.kicker}>Começar a aprender</p>
        <h1>Qual estrutura você quer estudar?</h1>
        <p>
          Cada uma passa pela mesma escada: observar uma demonstração, prever os passos, fazer sozinho e
          enfrentar o desafio.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="estrutura-lista">
          <p className={styles.tag}>Lista encadeada</p>
          <h2 id="estrutura-lista">Nós ligados por ponteiros</h2>
          <p className={styles.text}>Escolha o tipo de lista:</p>
          <ul className={styles.options}>
            {LIST_KINDS.map((k) => (
              <li key={k.kind}>
                <a className={styles.option} href={labHref("linkedList", k.kind)}>
                  <span className={styles.optionTitle}>{k.title}</span>
                  <span className={styles.optionText}>{k.text}</span>
                  <span className={styles.arrow} aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="estrutura-pilha">
          <p className={styles.tagAmber}>Pilha</p>
          <h2 id="estrutura-pilha">O último a entrar é o primeiro a sair</h2>
          <p className={styles.text}>
            push, pop e peek agindo sempre no topo. Ideal para entender LIFO e o underflow.
          </p>
          <ul className={styles.options}>
            <li>
              <a className={styles.option} href={labHref("stack")}>
                <span className={styles.optionTitle}>Pilha</span>
                <span className={styles.optionText}>Empilhar e desempilhar, passo a passo.</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
