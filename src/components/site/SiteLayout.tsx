import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { hrefFor, type Route } from "../../routing/useHashRoute";
import styles from "./SiteLayout.module.css";

const NAV: { route: Route; label: string }[] = [
  { route: "lab", label: "Simulador" },
  { route: "aprender", label: "Aprender" },
  { route: "progresso", label: "Progresso" },
  { route: "conta", label: "Conta" },
];

interface SiteLayoutProps {
  route: Route;
  children: ReactNode;
}

export function SiteLayout({ route, children }: SiteLayoutProps) {
  const lab = route === "lab";
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem("structuralab-theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("structuralab-theme", theme);
  }, [theme]);

  return (
    <div className={lab ? styles.labFrame : styles.frame}>
      <a className={styles.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={styles.nav}>
        <a className={styles.brand} href={hrefFor("home")}>
          Estrutura<span className={styles.brandAccent}>Viva</span>
        </a>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          <svg
            className={styles.themeIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M9 18h6M10 21h4M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z" />
            <path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M19.1 4.9l-1.4 1.4M20 12h2" />
          </svg>
        </button>
        <nav aria-label="Principal" className={styles.links}>
          {NAV.map((item) => (
            <a
              key={item.route}
              href={hrefFor(item.route)}
              className={item.route === route ? styles.active : styles.link}
              aria-current={item.route === route ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="conteudo" className={lab ? styles.labMain : styles.main}>
        {children}
      </main>
    </div>
  );
}
