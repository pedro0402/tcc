import { useState } from "react";
import styles from "./GuidedTour.module.css";

const TIPS = [
  {
    title: "1 / 3 — A estrutura já está montada",
    text: "Olhe o desenho. Na pilha o topo está em cima; na lista o head está à esquerda. Clique numa operação à esquerda para ver a mudança.",
  },
  {
    title: "2 / 3 — Código e desenho andam juntos",
    text: "A linha verde no CodeTrace é a instrução atual. O nó aceso e o rótulo amarelo dizem o que mudou (novo topo, next, underflow).",
  },
  {
    title: "3 / 3 — Depois você prevê",
    text: "A primeira operação é uma demonstração. Na segunda, pausamos e pedimos o próximo estado. Use ▶ se quiser ver de novo com calma.",
  },
];

interface GuidedTourProps {
  onDone: () => void;
}

export function GuidedTour({ onDone }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const tip = TIPS[index];

  return (
    <aside className={styles.tour} aria-label="Tour rápido">
      <p className={styles.kicker}>{tip.title}</p>
      <p>{tip.text}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.skip} onClick={onDone}>
          pular
        </button>
        {index < TIPS.length - 1 ? (
          <button
            type="button"
            className={styles.next}
            onClick={() => setIndex((i) => i + 1)}
          >
            próximo
          </button>
        ) : (
          <button type="button" className={styles.next} onClick={onDone}>
            começar
          </button>
        )}
      </div>
    </aside>
  );
}
