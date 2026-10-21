import { describe, expect, it } from "vitest";
import { hrefFor, parseHash, parseHashParams } from "./useHashRoute";

describe("parseHash", () => {
  it("reconhece as rotas, com ou sem query", () => {
    expect(parseHash("")).toBe("home");
    expect(parseHash("#")).toBe("home");
    expect(parseHash("#/")).toBe("home");
    expect(parseHash("#/lab")).toBe("lab");
    expect(parseHash("#/lab?s=stack")).toBe("lab");
    expect(parseHash("#/aprender")).toBe("aprender");
    expect(parseHash("#/estruturas")).toBe("estruturas");
    expect(parseHash("#/praticar?t=problemas&id=desfazer")).toBe("praticar");
  });

  it("aceita barra no fim e avisa quando a rota não existe", () => {
    expect(parseHash("#/lab/")).toBe("lab");
    expect(parseHash("#/nao-existe")).toBe("naoencontrada");
    expect(parseHash("#/lab/outra")).toBe("naoencontrada");
  });
});

describe("parseHashParams", () => {
  it("lê os parâmetros do hash", () => {
    expect(parseHashParams("#/lab?s=stack")).toEqual({ s: "stack" });
    expect(parseHashParams("#/praticar?t=problemas&id=desfazer")).toEqual({ t: "problemas", id: "desfazer" });
  });

  it("sem query ou com query vazia, devolve vazio", () => {
    expect(parseHashParams("#/lab")).toEqual({});
    expect(parseHashParams("#/lab?")).toEqual({});
    expect(parseHashParams("")).toEqual({});
  });

  it("decodifica e usa o primeiro valor de um parâmetro repetido", () => {
    expect(parseHashParams("#/lab?s=a%20b&s=c")).toEqual({ s: "a b" });
  });

  it("um segundo ? faz parte do valor", () => {
    expect(parseHashParams("#/lab?q=a?b")).toEqual({ q: "a?b" });
  });
});

describe("hrefFor", () => {
  it("monta o link das rotas", () => {
    expect(hrefFor("home")).toBe("#/");
    expect(hrefFor("lab")).toBe("#/lab");
    expect(hrefFor("lab", { s: "stack" })).toBe("#/lab?s=stack");
  });

  it("ignora parâmetros vazios", () => {
    expect(hrefFor("lab", {})).toBe("#/lab");
    expect(hrefFor("lab", { s: "" })).toBe("#/lab");
  });

  it("ida e volta preservam caracteres especiais", () => {
    const params = { id: "a b&c=d", t: "ç/ã" };
    const href = hrefFor("praticar", params);
    expect(parseHash(href)).toBe("praticar");
    expect(parseHashParams(href)).toEqual(params);
  });

  it("mantém compatibilidade com os links antigos", () => {
    expect(hrefFor("lab", { s: "list" })).toBe("#/lab?s=list");
    expect(hrefFor("lab", { s: "stack" })).toBe("#/lab?s=stack");
  });
});
