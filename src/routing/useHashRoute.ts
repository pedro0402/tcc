import { useEffect, useState } from "react";

// A rota "praticar" (problemas, jogos e projetos) já é reconhecida aqui, mas ainda
// não tem página nem item no menu: entra junto com a primeira atividade da área.
// Enquanto isso, o App mostra um aviso de "em breve" para ela.
// "naoencontrada" não é um endereço: é o que parseHash devolve para rotas desconhecidas.
export type Route = "home" | "estruturas" | "lab" | "praticar" | "aprender" | "progresso" | "conta" | "naoencontrada";
export type RouteParams = Record<string, string>;

const ROUTES: Route[] = ["home", "estruturas", "lab", "praticar", "aprender", "progresso", "conta"];

/** Separa "#/rota?a=1" em caminho e query. */
function split(hash: string): { path: string; query: string } {
  const body = hash.replace(/^#\/?/, "");
  const at = body.indexOf("?");
  const path = (at < 0 ? body : body.slice(0, at)).replace(/\/+$/, "");
  return { path, query: at < 0 ? "" : body.slice(at + 1) };
}

export function parseHash(hash: string): Route {
  const { path } = split(hash);
  if (path === "") return "home";
  return ROUTES.includes(path as Route) ? (path as Route) : "naoencontrada";
}

/** Parâmetros da query do hash. Repetidos ficam com o primeiro valor. */
export function parseHashParams(hash: string): RouteParams {
  const params: RouteParams = {};
  for (const [key, value] of new URLSearchParams(split(hash).query)) {
    if (!(key in params)) params[key] = value;
  }
  return params;
}

export function hrefFor(route: Route, params?: RouteParams): string {
  const base = route === "home" ? "#/" : `#/${route}`;
  const entries = Object.entries(params ?? {}).filter(([, value]) => value !== "");
  return entries.length ? `${base}?${new URLSearchParams(entries).toString()}` : base;
}

export function navigate(route: Route, params?: RouteParams): void {
  window.location.hash = hrefFor(route, params);
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(window.location.hash)
  );

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
