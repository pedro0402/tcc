import { useEffect, useState, type FormEvent } from "react";
import { auth, login, register } from "../../api/progressClient";
import { handleLogin, handleLogout } from "../../learning/bootstrap";
import styles from "./AuthBar.module.css";

type Pending = null | "login" | "register" | "logout";

/** Mesmas regras do servidor: email válido e senha de 6 a 72 bytes. */
export function validateCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um email válido.";
  if (password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  if (new TextEncoder().encode(password).length > 72) return "A senha pode ter no máximo 72 bytes.";
  return null;
}

export function AuthBar() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [loggedIn, setLoggedIn] = useState(() => auth().isLoggedIn());

  // A sessão pode vencer ou mudar fora deste componente.
  useEffect(
    () =>
      auth().subscribe((change) => {
        setLoggedIn(auth().isLoggedIn());
        if (change === "expired") setMessage("Sua sessão expirou. Entre de novo para continuar sincronizando.");
      }),
    [],
  );

  if (loggedIn) {
    return (
      <div className={styles.bar}>
        <span>Conta conectada — progresso sincroniza com o servidor.</span>
        <button
          type="button"
          disabled={pending !== null}
          onClick={async () => {
            setPending("logout");
            await handleLogout();
            setPending(null);
            setLoggedIn(false);
            setMessage("Sessão encerrada.");
          }}
        >
          {pending === "logout" ? "saindo…" : "sair"}
        </button>
        {message ? <span className={styles.msg} role="status">{message}</span> : null}
      </div>
    );
  }

  const submit = async (action: "login" | "register") => {
    if (pending) return;
    const invalid = validateCredentials(email, password);
    if (invalid) {
      setMessage(invalid);
      return;
    }
    setPending(action);
    setMessage(null);
    try {
      if (action === "login") {
        const ok = await login(email.trim(), password);
        if (ok) handleLogin();
        setLoggedIn(ok);
        setMessage(ok ? "Login ok." : "Falha no login (API offline ou credenciais).");
      } else {
        const ok = await register(email.trim(), password);
        setMessage(ok ? "Conta criada — faça login." : "Falha no registro.");
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <form
      className={styles.bar}
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void submit("login");
      }}
    >
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
        autoComplete="email"
        required
      />
      <input
        type="password"
        placeholder="senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Senha"
        autoComplete="current-password"
        minLength={6}
        required
      />
      <button type="submit" disabled={pending !== null}>
        {pending === "login" ? "entrando…" : "entrar"}
      </button>
      <button type="button" disabled={pending !== null} onClick={() => void submit("register")}>
        {pending === "register" ? "registrando…" : "registrar"}
      </button>
      {message ? <span className={styles.msg} role="status">{message}</span> : null}
    </form>
  );
}
