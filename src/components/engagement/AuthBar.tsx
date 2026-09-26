import { useState } from "react";
import { login, register } from "../../api/progressClient";
import styles from "./AuthBar.module.css";

export function AuthBar() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem("ds-visualizer-token"));
    } catch {
      return false;
    }
  });

  if (loggedIn) {
    return (
      <div className={styles.bar}>
        <span>Conta conectada — progresso sincroniza com o servidor.</span>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("ds-visualizer-token");
            setLoggedIn(false);
            setMessage("Sessão encerrada.");
          }}
        >
          sair
        </button>
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      <input
        type="password"
        placeholder="senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Senha"
      />
      <button
        type="button"
        onClick={async () => {
          const ok = await login(email, password);
          setLoggedIn(ok);
          setMessage(ok ? "Login ok." : "Falha no login (API offline ou credenciais).");
        }}
      >
        entrar
      </button>
      <button
        type="button"
        onClick={async () => {
          const ok = await register(email, password);
          setMessage(ok ? "Conta criada — faça login." : "Falha no registro.");
        }}
      >
        registrar
      </button>
      {message ? <span className={styles.msg}>{message}</span> : null}
    </div>
  );
}
