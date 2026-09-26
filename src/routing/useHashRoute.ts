import { useEffect, useState } from "react";

export type Route = "home" | "lab" | "aprender" | "progresso" | "conta";

const ROUTES: Route[] = ["home", "lab", "aprender", "progresso", "conta"];

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  if (path === "" || path === "/") return "home";
  return ROUTES.includes(path as Route) ? (path as Route) : "home";
}

export function hrefFor(route: Route): string {
  return route === "home" ? "#/" : `#/${route}`;
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route);
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
