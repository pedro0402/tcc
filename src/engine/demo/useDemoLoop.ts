import { useEffect, useState } from "react";
import type { DemoScript } from "./types";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Lista de mídia de movimento reduzido, ou null onde matchMedia não existe (SSR, jsdom, webviews antigos). */
function reducedMotionQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(REDUCED_MOTION);
}

/** Preferência de movimento reduzido, atualizada se o usuário mudar com a página aberta. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => reducedMotionQuery()?.matches ?? false);
  useEffect(() => {
    const mql = reducedMotionQuery();
    if (!mql) return;
    const onChange = () => setReduced(mql.matches);
    onChange();
    // Safari antigo só tem addListener.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);
  return reduced;
}

/**
 * Avança os frames de um DemoScript em loop.
 * Pausado com a aba oculta; com prefers-reduced-motion fica no estado final.
 * `frame` é undefined só se o roteiro não tiver frames.
 */
export function useDemoLoop(script: DemoScript) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(() =>
    reducedMotion ? Math.max(0, script.frames.length - 1) : 0,
  );
  const lastIndex = Math.max(0, script.frames.length - 1);
  const clampedIndex = reducedMotion ? lastIndex : Math.min(index, lastIndex);

  useEffect(() => {
    setIndex(reducedMotion ? lastIndex : 0);
  }, [script, reducedMotion, lastIndex]);

  useEffect(() => {
    if (script.frames.length < 2 || reducedMotion) return;

    let timeout: number | undefined;
    const arm = () => {
      const ms = script.frames[clampedIndex].holdMs ?? script.holdMs;
      timeout = window.setTimeout(() => {
        if (document.hidden) return;
        setIndex((i) => (i + 1) % script.frames.length);
      }, ms);
    };

    const onVis = () => {
      window.clearTimeout(timeout);
      if (!document.hidden) arm();
    };

    arm();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [script, clampedIndex, reducedMotion]);

  const frame = script.frames[clampedIndex];
  return { frame, index: clampedIndex, line: frame?.line ?? -1, code: script.code, kind: script.kind };
}
