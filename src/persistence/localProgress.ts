const KEY = "ds-visualizer-progress-v1";

export interface LocalProgress {
  completedOperations: Array<{
    structure: string;
    operation: string;
    completedAt: string;
  }>;
  quizAttempts: Array<{
    questionId: string;
    isCorrect: boolean;
    answeredAt: string;
  }>;
  predictions: Array<{
    structure: string;
    operation: string;
    isCorrect: boolean;
    answeredAt: string;
  }>;
}

function empty(): LocalProgress {
  return { completedOperations: [], quizAttempts: [], predictions: [] };
}

export function getLocalProgress(): LocalProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) } as LocalProgress;
  } catch {
    return empty();
  }
}

function save(progress: LocalProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // fallback silencioso
  }
}

export function recordOperationComplete(
  structure: string,
  operation: string
): void {
  const progress = getLocalProgress();
  progress.completedOperations.push({
    structure,
    operation,
    completedAt: new Date().toISOString(),
  });
  save(progress);
}

export function recordQuizAttempt(
  questionId: string,
  isCorrect: boolean
): void {
  const progress = getLocalProgress();
  progress.quizAttempts.push({
    questionId,
    isCorrect,
    answeredAt: new Date().toISOString(),
  });
  save(progress);
}

export function recordPrediction(
  structure: string,
  operation: string,
  isCorrect: boolean
): void {
  const progress = getLocalProgress();
  progress.predictions.push({
    structure,
    operation,
    isCorrect,
    answeredAt: new Date().toISOString(),
  });
  save(progress);
}
