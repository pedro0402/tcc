// Regra do estágio Desafio: meta a alcançar com limite de passos e tempo
// regressivo. A lógica é pura (sem timer nem React) para poder ser testada; o
// cronômetro em si vive no componente, que só informa o tempo restante.

export type DesafioStatus = "running" | "won" | "failed";

export interface DesafioState {
  target: number[];
  maxSteps: number;
  totalSeconds: number;
  stepsUsed: number;
  secondsLeft: number;
  status: DesafioStatus;
}

export function startDesafio(target: number[], maxSteps: number, seconds: number): DesafioState {
  return { target, maxSteps, totalSeconds: seconds, stepsUsed: 0, secondsLeft: seconds, status: "running" };
}

const matches = (target: number[], current: number[]) =>
  target.length === current.length && target.every((v, i) => v === current[i]);

/**
 * Registra uma operação concluída pelo usuário e reavalia o status.
 * Vence se o estado atual bate com a meta; falha se esgotou os passos sem vencer.
 */
export function afterStep(s: DesafioState, current: number[]): DesafioState {
  if (s.status !== "running") return s;
  const stepsUsed = s.stepsUsed + 1;
  if (matches(s.target, current)) return { ...s, stepsUsed, status: "won" };
  if (stepsUsed >= s.maxSteps) return { ...s, stepsUsed, status: "failed" };
  return { ...s, stepsUsed };
}

/** Avança o relógio (chamado a cada segundo). Zerar o tempo é falha. */
export function tick(s: DesafioState): DesafioState {
  if (s.status !== "running") return s;
  const secondsLeft = s.secondsLeft - 1;
  if (secondsLeft <= 0) return { ...s, secondsLeft: 0, status: "failed" };
  return { ...s, secondsLeft };
}

export const stepsLeft = (s: DesafioState): number => Math.max(0, s.maxSteps - s.stepsUsed);

/** mm:ss do tempo restante. */
export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
