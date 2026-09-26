import { useState } from "react";
import type { PlayerApi } from "./usePlayer";
import { CODE_LANGS, codeFor, type CodeLang } from "../../engine/viva/codeVariants";
import { Button, Icon, Slider, Switch } from "./ui";
import styles from "./viva.module.css";

export function Controls({ p }: { p: PlayerApi }) {
  const total = p.op?.steps.length ?? 0;
  return (
    <div className={styles.controls}>
      <div className={styles.controlBtns}>
        <Button size="icon" variant="ghost" onClick={p.restart} disabled={!p.op} aria-label="Reiniciar"><Icon name="restart" /></Button>
        <Button size="icon" variant="ghost" onClick={p.prev} disabled={!p.op || p.idx === 0} aria-label="Voltar"><Icon name="prev" /></Button>
        <Button size="icon" onClick={() => p.setPlaying(!p.playing)} disabled={!p.op || p.asking !== null} aria-label={p.playing ? "Pausar" : "Reproduzir"}>
          <Icon name={p.playing ? "pause" : "play"} />
        </Button>
        <Button size="icon" variant="ghost" onClick={p.next} disabled={!p.op || p.asking !== null} aria-label="Avançar"><Icon name="next" /></Button>
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
      <span className={styles.monoMuted}>acertos {p.score.ok}/{p.score.total}</span>
    </div>
  );
}

export function CodePanel({ p }: { p: PlayerApi }) {
  const [lang, setLang] = useState<CodeLang>("humano");
  const idlePlaceholder =
    lang === "humano"
      ? ["// escolha uma operação ao lado", "// para ver o passo a passo em português"]
      : ["// escolha uma operação ao lado", "// para ver o código executando"];
  const code =
    p.op && p.op.code.length ? codeFor(p.op.name, lang, p.op.code) : idlePlaceholder;
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
              <span className={on ? styles.lineTextOn : undefined}>{l}</span>
            </div>
          );
        })}
      </pre>
      {p.step && Object.keys(p.step.vars).length > 0 && (
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

export function PredictBox({ p }: { p: PlayerApi }) {
  if (p.asking === null || !p.op) return null;
  const q = p.op.steps[p.asking].predict!;
  const chosen = p.answered[p.asking];
  const done = chosen !== undefined;
  return (
    <div className={styles.predict} role="dialog" aria-label="Preveja o próximo passo">
      <div className={styles.predictKicker}>Preveja o próximo passo</div>
      <div className={styles.predictQ}>{q.question}</div>
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
          <span className={chosen === q.answer ? styles.textOk : styles.textBad}>
            {chosen === q.answer ? "Correto!" : "Não exatamente — veja o que acontece."}
          </span>
          <Button size="sm" onClick={p.continueAfter}>Continuar</Button>
        </div>
      )}
    </div>
  );
}
