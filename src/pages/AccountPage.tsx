import { AuthBar } from "../components/engagement/AuthBar";
import styles from "./AccountPage.module.css";

export function AccountPage() {
  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>Sincronização opcional</p>
        <h1>Conta</h1>
        <p>
          O laboratório funciona sem cadastro. Entre apenas se quiser guardar
          progresso e quizzes no servidor. Se a API estiver fora, a visualização
          continua — só o acompanhamento remoto some.
        </p>
      </header>
      <AuthBar />
    </div>
  );
}
