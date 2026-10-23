import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { listCode, listInsertHead, type Step } from "../../engine/viva/engine";
import { nodesFromValues } from "../../engine/viva/initialState";
import { ListCanvas } from "../viva/Canvas";
import { usePlayer } from "../viva/usePlayer";
import styles from "./HeroPreview.module.css";
import vivaStyles from "../viva/viva.module.css";

/** Uma nova sessão restaura a amostra e limpa o relógio do player anterior. */
export function HeroPreview() {
  const [session, setSession] = useState(0);
  return <PreviewSession key={session} focusInput={session > 0} onReset={() => setSession((n) => n + 1)} />;
}

function PreviewSession({ focusInput, onReset }: { focusInput: boolean; onReset: () => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const [nodes] = useState(() => nodesFromValues([8, 15]));
  const [value, setValue] = useState("3");
  const [completed, setCompleted] = useState(false);
  const onDone = useCallback(() => setCompleted(true), []);
  const player = usePlayer({ onDone });

  useEffect(() => {
    if (focusInput) inputRef.current?.focus({ preventScroll: true });
  }, [focusInput]);

  const insert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (player.busy || completed || !inputRef.current?.reportValidity()) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    visualRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    player.setPredictMode(false);
    player.setSpeed(650);
    player.start(listInsertHead(nodes, inputRef.current.valueAsNumber));
    // O pedido explícito continua funcionando sem exigir movimento para explicar o resultado.
    if (reducedMotion) player.skip();
  };

  const initial: Step = {
    line: -1,
    nodes,
    pointers: { cabeca: 0 },
    highlight: [],
    message: "Escolha um valor e veja a lista mudar.",
    vars: {},
  };
  const step = player.step ?? initial;
  const code = player.op?.code ?? listCode.insertHead;

  return (
    <div className={styles.experiment}>
      <header className={styles.head}>
        <p className={styles.kicker}>Mini laboratório · Lista encadeada</p>
        <h2 className={styles.title}>Insira um nó no início</h2>
        <p className={styles.intro}>Escolha um valor e acompanhe código e ponteiros.</p>
      </header>

      <form className={styles.form} onSubmit={insert}>
        <div className={styles.field}>
          <label htmlFor={inputId}>Valor do novo nó</label>
          <input
            ref={inputRef}
            id={inputId}
            type="number"
            min={-99}
            max={99}
            step={1}
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={player.busy || completed}
          />
        </div>
        <button
          className={styles.insert}
          type={completed ? "button" : "submit"}
          onClick={completed ? onReset : undefined}
          disabled={player.busy}
        >
          {completed ? "Experimentar de novo" : player.busy ? "Inserindo…" : "Inserir no início"}
          <span aria-hidden="true">{completed ? "↻" : "→"}</span>
        </button>
      </form>

      <div ref={visualRef} className={styles.visual}>
        {/* Reutiliza o escopo de tokens e o desenho do laboratório, sem alterar seus estilos. */}
        <div className={`${vivaStyles.root} ${styles.diagram}`}>
          <ListCanvas step={step} kind="simples" />
        </div>

        <p className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
          {completed && <span className={styles.check} aria-hidden="true">✓</span>}
          {completed ? `Inserção concluída. ${step.message}` : step.message}
        </p>
      </div>

      <div className={styles.codePanel}>
        <div className={styles.codeHead}>
          <span>Código sincronizado</span>
          <span className={styles.stepCount}>
            {player.op ? `Passo ${player.idx + 1} de ${player.op.steps.length}` : "Sua vez"}
          </span>
        </div>
        <pre className={styles.code} aria-label="Código da inserção no início">
          {code.map((line, index) => (
            <span key={index} className={step.line === index ? styles.codeOn : styles.codeLine} aria-current={step.line === index ? "step" : undefined}>
              <span className={styles.lineNumber} aria-hidden="true">{index + 1}</span>
              <code>{line}</code>
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
