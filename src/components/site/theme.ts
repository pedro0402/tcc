// Tema claro/escuro. A chave de armazenamento acompanha o nome do produto;
// a antiga ("structuralab-theme") é lida uma vez e substituída, para ninguém perder a escolha.

export type Theme = "light" | "dark";
export const THEME_KEY = "estruturaviva-theme";
export const OLD_THEME_KEY = "structuralab-theme";
// O script inline do index.html repete as chaves e o padrão para aplicar o tema
// antes do React montar (sem piscar). Mudou aqui, mude lá também.
export const DEFAULT_THEME: Theme = "dark";

type ThemeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isTheme = (v: string | null): v is Theme => v === "light" || v === "dark";

/** localStorage se estiver acessível; null em SSR ou quando o navegador bloqueia. */
export function safeStorage(): ThemeStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadTheme(storage: ThemeStorage | null): Theme {
  if (!storage) return DEFAULT_THEME;
  try {
    const current = storage.getItem(THEME_KEY);
    if (isTheme(current)) return current;
    const old = storage.getItem(OLD_THEME_KEY);
    if (isTheme(old)) {
      storage.setItem(THEME_KEY, old);
      storage.removeItem(OLD_THEME_KEY);
      return old;
    }
  } catch {
    // Armazenamento indisponível: usa o padrão.
  }
  return DEFAULT_THEME;
}

export function saveTheme(storage: ThemeStorage | null, theme: Theme): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_KEY, theme);
    storage.removeItem(OLD_THEME_KEY);
  } catch {
    // Sem gravar, o tema vale só nesta sessão.
  }
}
