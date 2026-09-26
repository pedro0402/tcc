import { useMemo, useState } from "react";
import styles from "./Engagement.module.css";

interface PredictionPromptProps {
  prompt: string;
  choices: Array<string | number | boolean>;
  onSubmit: (answer: string) => void;
  lastCorrect: boolean | null;
}

function uniqueChoices(choices: Array<string | number | boolean>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const choice of choices) {
    const key = String(choice);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function PredictionPrompt({
  prompt,
  choices,
  onSubmit,
  lastCorrect,
}: PredictionPromptProps) {
  const options = useMemo(() => {
    const list = uniqueChoices(choices);
    return [...list].sort(() => Math.random() - 0.5);
  }, [choices]);

  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className={styles.box} role="dialog" aria-label="Previsão do próximo estado">
      <p className={styles.kicker}>Sua vez — escolha antes de ver o resultado</p>
      <p className={styles.prompt}>{prompt}</p>
      <div className={styles.options}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.option}
            disabled={lastCorrect !== null}
            onClick={() => {
              setPicked(option);
              onSubmit(option);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {lastCorrect === true ? (
        <p className={styles.ok}>Isso. A animação mostra exatamente essa mudança.</p>
      ) : null}
      {lastCorrect === false ? (
        <p className={styles.bad}>
          {picked ? `Você escolheu ${picked}. ` : ""}
          Observe o desenho no próximo passo — o rótulo amarelo aponta o que mudou.
        </p>
      ) : null}
    </div>
  );
}
