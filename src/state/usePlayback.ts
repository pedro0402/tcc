import { useExecutionStore } from "./executionStore";

export function usePlayback() {
  const status = useExecutionStore((s) => s.status);
  const speed = useExecutionStore((s) => s.speed);
  const currentIndex = useExecutionStore((s) => s.currentIndex);
  const steps = useExecutionStore((s) => s.steps);
  const play = useExecutionStore((s) => s.play);
  const pause = useExecutionStore((s) => s.pause);
  const stepForward = useExecutionStore((s) => s.stepForward);
  const stepBackward = useExecutionStore((s) => s.stepBackward);
  const setSpeed = useExecutionStore((s) => s.setSpeed);

  return {
    status,
    speed,
    play,
    pause,
    stepForward,
    stepBackward,
    setSpeed,
    canGoBack: currentIndex > 0,
    canGoForward:
      currentIndex >= 0 &&
      currentIndex < steps.length - 1 &&
      status !== "awaiting-prediction",
    canPlay:
      steps.length > 0 &&
      status !== "awaiting-prediction" &&
      status !== "done" &&
      currentIndex < steps.length - 1,
  };
}
