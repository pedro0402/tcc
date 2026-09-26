import { useEffect, useRef, useState } from "react";
import type { Op, Step } from "../../engine/viva/engine";

interface PlayerCallbacks {
  onDone: (op: Op) => void;
  onPredict?: (op: Op, correct: boolean) => void;
}

/** Player do EstruturaViva: reprodução, modo previsão e placar. */
export function usePlayer({ onDone, onPredict }: PlayerCallbacks) {
  const [op, setOp] = useState<Op | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [predictMode, setPredictMode] = useState(true);
  const [asking, setAsking] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const [score, setScore] = useState({ ok: 0, total: 0 });
  // Depois que a operação chega ao fim o estado já foi aplicado; voltar passos
  // é só revisão e não deve travar os botões de operação.
  const [finished, setFinished] = useState(false);
  const doneRef = useRef(false);

  const start = (o: Op, opts: { autoPlay?: boolean } = {}) => {
    setOp(o);
    setIdx(0);
    setAnswered({});
    setAsking(null);
    setFinished(false);
    doneRef.current = false;
    setPlaying(opts.autoPlay ?? true);
  };

  const next = () => {
    if (!op || asking !== null) return;
    const n = idx + 1;
    if (n >= op.steps.length) {
      setPlaying(false);
      return;
    }
    if (predictMode && op.steps[n].predict && answered[n] === undefined) {
      setAsking(n);
      setPlaying(false);
      return;
    }
    setIdx(n);
  };

  const answer = (choice: number) => {
    if (asking === null || !op || answered[asking] !== undefined) return;
    const correct = op.steps[asking].predict!.answer === choice;
    setAnswered((a) => ({ ...a, [asking]: choice }));
    setScore((s) => ({ ok: s.ok + (correct ? 1 : 0), total: s.total + 1 }));
    onPredict?.(op, correct);
  };

  const continueAfter = () => {
    if (asking === null) return;
    setIdx(asking);
    setAsking(null);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(next, speed);
    return () => window.clearTimeout(t);
  });

  useEffect(() => {
    if (op && idx === op.steps.length - 1 && !doneRef.current) {
      doneRef.current = true;
      setFinished(true);
      setPlaying(false);
      onDone(op);
    }
  }, [op, idx, onDone]);

  const skip = () => {
    if (!op) return;
    setAsking(null);
    setIdx(op.steps.length - 1);
    setPlaying(false);
  };

  const step: Step | null = op ? op.steps[idx] : null;
  const busy = !!op && !finished;
  return {
    op, idx, step, playing, setPlaying, speed, setSpeed, predictMode, setPredictMode,
    asking, answered, answer, continueAfter, score, start, next, skip, busy,
    prev: () => { setPlaying(false); setAsking(null); setIdx((i) => Math.max(0, i - 1)); },
    restart: () => { setIdx(0); setAsking(null); setPlaying(false); },
  };
}

export type PlayerApi = ReturnType<typeof usePlayer>;
