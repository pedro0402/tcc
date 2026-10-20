import { useState } from "react";
import type { PlayerApi } from "./usePlayer";
import { CODE_LANGS, codeFor, type CodeLang } from "../../engine/viva/codeVariants";
import { Button, Icon, Slider, Switch } from "./ui";
import styles from "./viva.module.css";

export function Controls({ p }: { p: PlayerApi }) {
  const total = p.op?.steps.length ?? 0;
  // Pergunta, ponteiro ou comentário aberto: só o "Continuar" da caixa avança.
  const waiting = p.asking !== null || p.doAsking !== null || p.examplePaused !== null;
  const atEnd = total > 0 && p.idx >= total - 1;
  const playLabel = p.playing ? "Pausar" : atEnd ? "Reproduzir de novo" : "Reproduzir";
  return (
    <div className={styles.controls}>
      <div className={styles.controlBtns}>
        <Button size="icon" variant="ghost" onClick={p.restart} disabled={!p.op} aria-label="Reiniciar"><Icon name="restart" /></Button>
        <Button size="icon" variant="ghost" onClick={p.prev} disabled={!p.op || p.idx === 0} aria-label="Voltar"><Icon name="prev" /></Button>
        <Button size="icon" onClick={() => p.setPlaying(!p.playing)} disabled={!p.op || waiting} aria-label={playLabel} title={playLabel}>
          <Icon name={p.playing ? "pause" : atEnd ? "restart" : "play"} />
        </Button>
        <Button size="icon" variant="ghost" onClick={p.next} disabled={!p.op || waiting || atEnd} aria-label="Avançar"><Icon name="next" /></Button>
        <Button size="icon" variant="ghost" onClick={p.skip} disabled={!p.busy} aria-label="Pular para o fim"><Icon name="skip" /></Button>
      </div>
      <span className={styles.monoMuted}>passo {total ? p.idx + 1 : 0}/{total}</span>
      <div className={styles.speed}>
        <span className={styles.textMuted}>Lento</span>
        <Slider min={200} max={2000} step={100} value={2200 - p.speed} onChange={(v) => p.setSpeed(2200 - v)} label="Velocidade" />
        <span className={styles.textMuted}>Rápido</span>
      </div>
      <div className={styles.predictToggle}>
        <Switch checked={p.predictMode} onCheckedChange={p.setPredictMode} label="Modo previsão" />
      </div>
      <div className={styles.predictToggle}>
        <Switch checked={p.confidenceMode} onCheckedChange={p.setConfidenceMode} label="Pedir confiança" />
      </div>
      <span className={styles.monoMuted}>acertos {p.score.ok}/{p.score.total}</span>
    </div>
  );
}

/** Quantidade de espaços no começo da linha de código. */
const indentOf = (line: string) => line.length - line.trimStart().length;

export function CodePanel({ p, showVars = true }: { p: PlayerApi; showVars?: boolean }) {
  const [lang, setLang] = useState<CodeLang>("humano");
  const idlePlaceholder =
    lang === "humano"
      ? ["// escolha uma operação ao lado", "// para ver o passo a passo em português"]
      : ["// escolha uma operação ao lado", "// para ver o código executando"];
  const code =
    p.op && p.op.code.length ? codeFor(p.op.name, lang, p.op.code, p.op.variant) : idlePlaceholder;
  return (
    <div className={styles.code}>
      <div className={styles.codeHead}>
        <span>código</span>
        <div className={styles.langs} role="tablist" aria-label="Linguagem do código">
          {CODE_LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={lang === l.id}
              className={lang === l.id ? styles.langOn : styles.lang}
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <pre className={styles.codeBody} aria-label="Código da operação">
        {code.map((l, i) => {
          const on = p.step?.line === i;
          return (
            <div
              key={i}
              className={on ? (p.step?.error ? styles.lineErr : styles.lineOn) : styles.line}
              aria-current={on ? "step" : undefined}
            >
              <span className={styles.lineNo}>{i + 1}</span>
              {/* O recuo vira margem: se a linha quebrar, a continuação fica alinhada ao texto. */}
              <span className={on ? styles.lineTextOn : undefined} style={indentOf(l) ? { paddingLeft: `${indentOf(l)}ch` } : undefined}>
                {l.slice(indentOf(l))}
              </span>
            </div>
          );
        })}
      </pre>
      {showVars && p.step && Object.keys(p.step.vars).length > 0 && (
        <div className={styles.vars}>
          <div className={styles.varsHead}>variáveis</div>
          {Object.entries(p.step.vars).map(([k, v]) => (
            <div key={k}>
              <span className={styles.varKey}>{k}</span> = <span className={styles.varVal}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { misconception } from "../../content/misconceptions";
import { doAnswerText } from "../../engine/viva/doStage";

/**
 * Estágio Fazer: pede ao aluno que aponte o destino de um ponteiro clicando
 * num nó do desenho (ou no botão "null"). Mostra a pergunta e, após responder,
 * se acertou e qual era o destino certo.
 */
export function DoBox({ p }: { p: PlayerApi }) {
  if (p.doAsking === null || !p.op || !p.doStep) return null;
  const step = p.doStep;
  const chosen = p.doAnswered[p.doAsking];
  const done = chosen !== undefined;
  const correct = done && chosen === step.answerId;
  const answerText = doAnswerText(p.op, step);

  return (
    <div className={styles.predict} role="dialog" aria-label="Aponte o ponteiro">
      <div className={styles.predictKicker}>Sua vez — aponte o ponteiro</div>
      <div className={styles.predictQ}>{step.question} Clique no nó de destino no desenho.</div>
      <div className={styles.doActions}>
        <Button size="sm" variant="outline" disabled={done} onClick={() => p.answerDo(null)}>
          Aponta para null
        </Button>
      </div>
      {done && (
        <div className={styles.predictFoot} aria-live="polite">
          <p className={styles.predictVerdict}>
            <strong className={correct ? styles.textOk : styles.textBad}>
              {correct ? "Correto." : "Não exatamente."}
            </strong>{" "}
            {correct ? `"${step.pointer}" aponta para ${answerText}.` : `"${step.pointer}" deveria apontar para ${answerText}.`}
          </p>
          <Button size="sm" onClick={p.continueAfterDo}>Continuar</Button>
        </div>
      )}
    </div>
  );
}

const CONFIDENCE_LEVELS: { level: 0 | 1 | 2; label: string }[] = [
  { level: 0, label: "Chute" },
  { level: 1, label: "Acho que sei" },
  { level: 2, label: "Tenho certeza" },
];

/** Modo Exemplo: pausa a demonstração num passo-chave com um comentário. */
export function ExampleBox({ p }: { p: PlayerApi }) {
  if (p.examplePaused === null || !p.exampleNote) return null;
  return (
    <div className={styles.predict} role="dialog" aria-label="Exemplo comentado">
      <div className={styles.predictKicker}>Exemplo comentado</div>
      <p className={styles.predictVerdict}>{p.exampleNote}</p>
      <div className={styles.predictFoot}>
        <Button size="sm" onClick={p.continueExample}>Entendi</Button>
      </div>
    </div>
  );
}

export function PredictBox({ p }: { p: PlayerApi }) {
  if (p.asking === null || !p.op) return null;
  const q = p.op.steps[p.asking].predict!;
  const chosen = p.answered[p.asking];
  const done = chosen !== undefined;
  const correct = done && chosen === q.answer;
  const chosenMiscon = done && !correct ? q.misconceptions?.[chosen] : undefined;
  const askingConfidence = p.needsConfidence;

  return (
    <div className={styles.predict} role="dialog" aria-label="Preveja o próximo passo">
      <div className={styles.predictKicker}>Preveja o próximo passo</div>
      <div className={styles.predictQ}>{q.question}</div>

      {askingConfidence ? (
        <div className={styles.confidence}>
          <span className={styles.confidenceLabel}>Antes de responder: o quanto você tem certeza?</span>
          <div className={styles.confidenceOpts} role="group" aria-label="Nível de confiança">
            {CONFIDENCE_LEVELS.map((c) => (
              <button key={c.level} type="button" className={styles.confidenceBtn} onClick={() => p.setConfidence(c.level)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.predictOpts}>
            {q.options.map((o, i) => {
              const state = !done ? "" : i === q.answer ? styles.optOk : i === chosen ? styles.optBad : styles.optDim;
              return (
                <button key={i} type="button" disabled={done} onClick={() => p.answer(i)} className={`${styles.opt} ${state}`}>
                  {o}
                </button>
              );
            })}
          </div>
          {done && (
            <div className={styles.predictFoot} aria-live="polite">
              <p className={styles.predictVerdict}>
                <strong className={correct ? styles.textOk : styles.textBad}>
                  {correct ? "Correto." : "Não exatamente."}
                </strong>{" "}
                {chosenMiscon ? misconception(chosenMiscon).explain : q.explain ?? "Veja o que acontece no desenho."}
              </p>
              <Button size="sm" onClick={p.continueAfter}>Continuar</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
