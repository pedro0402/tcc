import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { hrefFor, type Route } from "../../routing/useHashRoute";
import { loadTheme, safeStorage, saveTheme, type Theme } from "./theme";
import styles from "./SiteLayout.module.css";

// A barra do topo só tem a marca (volta à Home) e o tema. Simulador, lições,
// progresso e conta são acessados pela Home.
interface SiteLayoutProps {
  route: Route;
  children: ReactNode;
}

export function SiteLayout({ route, children }: SiteLayoutProps) {
  const lab = route === "lab";
  // Home e simulador ocupam a tela sem rolar (no desktop).
  const fitted = route === "home" || route === "aprender";
  const fixed = lab || fitted;
  const [theme, setTheme] = useState<Theme>(() => loadTheme(safeStorage()));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(safeStorage(), theme);
  }, [theme]);

  return (
    <div className={fixed ? styles.labFrame : styles.frame}>
      <a className={styles.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={styles.nav}>
        <a className={styles.brand} href={hrefFor("home")} aria-current={route === "home" ? "page" : undefined}>
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
      </header>
      <main id="conteudo" className={lab ? styles.labMain : fitted ? styles.fitMain : styles.main}>
        {children}
      </main>
    </div>
  );
}
