import { useEffect } from "react";
import { useExecutionStore } from "./executionStore";

/** Avança automaticamente enquanto status === "playing". */
export function useAutoAdvance(): void {
  const status = useExecutionStore((s) => s.status);
  const speed = useExecutionStore((s) => s.speed);
  const stepForward = useExecutionStore((s) => s.stepForward);

  useEffect(() => {
    if (status !== "playing") return;

    const id = window.setInterval(() => {
      const state = useExecutionStore.getState();
      if (state.status !== "playing") return;
      if (state.currentIndex >= state.steps.length - 1) {
        state.pause();
        return;
      }
      stepForward();
    }, speed);

    return () => window.clearInterval(id);
  }, [status, speed, stepForward]);
}
