import { hrefFor } from "../routing/useHashRoute";
import styles from "./NotFoundPage.module.css";

/**
 * Rota que não existe (link quebrado ou digitado errado) ou que ainda não tem
 * página ("soon"). Antes, as duas caíam na Home sem aviso.
 */
export function NotFoundPage({ soon = false }: { soon?: boolean }) {
  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>{soon ? "Em breve" : "Página não encontrada"}</p>
        <h1>{soon ? "Esta área ainda está em construção" : "Não achamos esta página"}</h1>
      </header>
      <p>
        {soon
          ? "Os problemas, jogos e projetos de prática chegam numa próxima versão. Enquanto isso, o simulador já tem a escada completa: observar, prever, fazer e o desafio."
          : "O endereço pode estar incompleto ou ter mudado. Escolha um dos caminhos abaixo."}
      </p>
      <nav className={styles.links} aria-label="Caminhos">
        <a href={hrefFor("estruturas")}>Abrir o simulador</a>
        <a href={hrefFor("aprender")}>Ver as lições</a>
        <a href={hrefFor("home")}>Voltar ao início</a>
      </nav>
    </div>
  );
}
