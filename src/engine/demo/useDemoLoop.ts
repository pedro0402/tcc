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

  useEffect(() => {
    setIndex(prefersReducedMotion() ? Math.max(0, script.frames.length - 1) : 0);
  }, [script]);

  useEffect(() => {
    if (script.frames.length < 2 || prefersReducedMotion()) return;

    let timeout: number | undefined;
    const arm = () => {
      const ms = script.frames[index].holdMs ?? script.holdMs;
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
  }, [script, index]);

  const frame = script.frames[index];
  return { frame, index, line: frame?.line ?? -1, code: script.code, kind: script.kind };
}
