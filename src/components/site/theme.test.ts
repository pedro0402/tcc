import { describe, expect, it } from "vitest";
import { OLD_THEME_KEY, THEME_KEY, loadTheme, saveTheme } from "./theme";

const store = (init: Record<string, string> = {}) => {
  const data = new Map(Object.entries(init));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
};

describe("tema", () => {
  it("sem nada salvo, o padrão é escuro", () => {
    expect(loadTheme(store())).toBe("dark");
    expect(loadTheme(null)).toBe("dark");
  });

  it("lê a chave nova", () => {
    expect(loadTheme(store({ [THEME_KEY]: "light" }))).toBe("light");
  });

  it("migra a chave antiga uma vez e a remove", () => {
    const s = store({ [OLD_THEME_KEY]: "light" });
    expect(loadTheme(s)).toBe("light");
    expect(s.data.get(THEME_KEY)).toBe("light");
    expect(s.data.has(OLD_THEME_KEY)).toBe(false);
    expect(loadTheme(s)).toBe("light"); // segunda leitura vem da chave nova
  });

  it("a chave nova vence a antiga", () => {
    expect(loadTheme(store({ [THEME_KEY]: "dark", [OLD_THEME_KEY]: "light" }))).toBe("dark");
  });

  it("ignora valores inválidos", () => {
    expect(loadTheme(store({ [THEME_KEY]: "azul" }))).toBe("dark");
    expect(loadTheme(store({ [OLD_THEME_KEY]: "roxo" }))).toBe("dark");
  });

  it("salvar grava a chave nova e limpa a antiga", () => {
    const s = store({ [OLD_THEME_KEY]: "dark" });
    saveTheme(s, "light");
    expect(s.data.get(THEME_KEY)).toBe("light");
    expect(s.data.has(OLD_THEME_KEY)).toBe(false);
  });

  it("não quebra se o armazenamento recusar", () => {
    const quebrado = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(loadTheme(quebrado)).toBe("dark");
    expect(() => saveTheme(quebrado, "light")).not.toThrow();
    expect(() => saveTheme(null, "light")).not.toThrow();
  });
});
