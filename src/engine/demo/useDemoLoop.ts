import { useEffect, useState } from "react";
import type { DemoScript } from "./types";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Avança os frames de um DemoScript em loop.
 * Pausado com a aba oculta; com prefers-reduced-motion fica no estado final.
 */
export function useDemoLoop(script: DemoScript) {
  const [index, setIndex] = useState(() =>
    prefersReducedMotion() ? Math.max(0, script.frames.length - 1) : 0,
  );
  const reducedMotion = prefersReducedMotion();
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
