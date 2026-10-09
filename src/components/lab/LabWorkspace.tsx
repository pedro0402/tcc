import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as E from "../../engine/viva/engine";
import type { Node, Op, Step, Structure } from "../../engine/viva/engine";
import type { OpId } from "../../engine/viva/opIds";
import { listOps } from "../../engine/viva/lists";
import { chain } from "../../engine/viva/links";
import { opFromSpec, type OpSpec } from "../../engine/viva/runOps";
import { nodesFromValues } from "../../engine/viva/initialState";
import { selfExplainFor } from "../../content/selfExplain";
import { recordSelfExplanation } from "../../persistence/localProgress";
import {
  applyAttempt,
  initialScaffold,
  remainingToAdvance,
  setStage,
  STAGES,
  STAGE_HINT,
  STAGE_LABEL,
  type ScaffoldState,
  type Stage,
} from "../../engine/viva/scaffold";
import { matchesTarget } from "../../engine/viva/challenge";
import {
  afterStep,
  formatSeconds,
  startDesafio,
  stepsLeft,
  tick,
  type DesafioState,
} from "../../engine/viva/desafioState";
import {
  desafioSpec,
  fazerGoal,
  observeScript,
  previewScript,
  type Goal,
  type ScriptStep,
} from "../../content/scaffoldScripts";
import { keyStepsFor } from "../../content/workedExamples";
import { usePlayer, type PredictEvent } from "../viva/usePlayer";
import { CodePanel, Controls, DoBox, ExampleBox, PredictBox } from "../viva/Player";
import { ListCanvas, StackCanvas, type ListKind } from "../viva/Canvas";
import { Button, Input } from "../viva/ui";
import styles from "../viva/viva.module.css";

/** Nome da operação "vazia" que só exibe o estado atual. Não conta como progresso. */
export const IDLE = "idle";

/** Passo "parado": só mostra o estado atual, com os ponteiros de entrada da estrutura. */
export function idleStepFor(structure: Structure, nodes: Node[], kind?: ListKind): Step {
  const n = nodes.length;
  const pointers: Record<string, number | null> =
    structure === "stack"
      ? { topo: n ? 0 : null }
      : { cabeca: n ? 0 : null, ...(kind === "dupla" ? { cauda: n ? n - 1 : null } : {}) };
  return {
    line: -1,
    nodes,
    pointers,
    highlight: [],
    message: "Escolha uma operação para começar.",
    vars: {},
    links: structure === "linkedList" && kind && kind !== "simples" ? chain(n, kind) : undefined,
  };
}

export const idleOp = (structure: Structure, nodes: Node[], kind?: ListKind): Op => ({
  name: IDLE,
  structure,
  code: [],
  final: nodes,
  steps: [idleStepFor(structure, nodes, kind)],
});

export interface LabWorkspaceProps {
  structure: Structure;
  kind?: ListKind;
  onKindChange?: (kind: ListKind) => void;
  nodes: Node[];
  onNodesChange: (nodes: Node[], structure: Structure) => void;
  onOpDone?: (op: Op) => void;
  onPredict?: (event: PredictEvent) => void;
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Simulador com a escada de scaffolding (Observar, Prever, Fazer, Desafio).
 * Cada estágio reconfigura o que o aluno vê e faz; ver os blocos por estágio
 * mais abaixo.
 */
export function LabWorkspace({
  structure,
  kind = "simples",
  onKindChange,
  nodes,
  onNodesChange,
  onOpDone,
  onPredict,
  onBusyChange,
}: LabWorkspaceProps) {
  const isList = structure === "linkedList";
  const [val, setVal] = useState("42");
  const [pos, setPos] = useState("1");
  const [detail, setDetail] = useState<"essencial" | "completo">("completo");

  const nodesChangeRef = useRef(onNodesChange);
  const opDoneRef = useRef(onOpDone);
  const predictRef = useRef(onPredict);
  nodesChangeRef.current = onNodesChange;
  opDoneRef.current = onOpDone;
  predictRef.current = onPredict;

  const [scaffold, setScaffold] = useState<ScaffoldState>(initialScaffold);
  const stage = scaffold.stage;
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Fila de passos do roteiro automático (Observar e Prever).
  const scriptQueue = useRef<ScriptStep[]>([]);
  // Estado em que o Observar terminou, herdado pelo Prever.
  const observeResult = useRef<number[] | null>(null);
  // Progresso visível do roteiro: "operação atual de total" e a legenda.
  const [scriptProgress, setScriptProgress] = useState<{ index: number; total: number; caption: string } | null>(null);
  const scriptTotal = useRef(0);

  // Estado do estágio Fazer e Desafio.
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalDone, setGoalDone] = useState(false);
  const [desafio, setDesafio] = useState<DesafioState | null>(null);

  const [explained, setExplained] = useState<Op | null>(null);

  // Dispara a próxima operação do roteiro sobre `base` (o estado real atual),
  // evitando closures de `nodes` desatualizadas entre operações encadeadas.
  const runNextScripted = useCallback((base: Node[]) => {
    const q = scriptQueue.current;
    if (q.length === 0) return false;
    const stepDef = q.shift()!;
    const op = opFromSpec(structure, kind, base, stepDef.spec);
    // Mostra "operação atual de total" com a legenda do roteiro.
    const index = scriptTotal.current - q.length;
    setScriptProgress({ index, total: scriptTotal.current, caption: stepDef.caption });
    if (stageRef.current === "observar") {
      const stops: Record<number, string> = {};
      for (const k of keyStepsFor(op)) stops[k.stepIndex] = k.text;
      p.start(op, { exampleStops: stops });
    } else {
      p.start(op);
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure, kind]);

  const handleDone = useCallback((op: Op) => {
    nodesChangeRef.current(op.final, op.structure);
    if (op.name === IDLE) return;
    opDoneRef.current?.(op);
    const st = stageRef.current;

    // Roteiro automático (Observar/Prever): encadeia a próxima operação a partir
    // do estado real que acabou de ser produzido (op.final).
    if (st === "observar" || st === "prever") {
      // Guarda o estado final já: se for o último, o Prever herda daqui.
      if (st === "observar") observeResult.current = op.final.map((n) => n.value);
      if (scriptQueue.current.length > 0) {
        const base = op.final;
        setTimeout(() => runNextScripted(base), 600);
      } else {
        // Roteiro terminou: deixa o indicador no total e marca como concluído.
        setScriptProgress((prev) => (prev ? { ...prev, index: prev.total } : prev));
      }
      return;
    }

    // Fazer: verifica a meta.
    if (st === "fazer" && goal) {
      const reached = matchesTarget(goal.target, op.final.map((n) => n.value));
      if (reached) {
        setGoalDone(true);
        setScaffold((s) => applyAttempt(s, { correct: true }));
      }
    }

    // Desafio: conta o passo e reavalia tempo/meta.
    if (st === "desafio") {
      setDesafio((d) => {
        if (!d || d.status !== "running") return d;
        const next = afterStep(d, op.final.map((n) => n.value));
        if (next.status === "won") setScaffold((s) => applyAttempt(s, { correct: true }));
        return next;
      });
    }

    // Autoexplicação só nos estágios de prática.
    const hadError = op.steps.some((s) => s.error);
    setExplained((st === "fazer" || st === "desafio") && !hadError && selfExplainFor(op.name) ? op : null);
  }, [goal, runNextScripted]);

  const handlePredict = useCallback((e: PredictEvent) => {
    predictRef.current?.(e);
    setScaffold((s) => applyAttempt(s, { correct: e.correct }));
  }, []);
  const handleDo = useCallback((e: { correct: boolean }) => {
    setScaffold((s) => applyAttempt(s, { correct: e.correct }));
  }, []);
  const p = usePlayer({ onDone: handleDone, onPredict: handlePredict, onDo: handleDo });

  useEffect(() => {
    onBusyChange?.(p.busy);
  }, [p.busy, onBusyChange]);

  // Configura cada estágio ao entrar nele (ou ao trocar de estrutura/tipo).
  // Observar e Prever montam estados fixos e rodam roteiros; Fazer e Desafio
  // começam vazios com uma meta.
  const setupStage = useCallback((st: Stage) => {
    setExplained(null);
    setGoalDone(false);
    setScriptProgress(null);
    scriptQueue.current = [];
    p.setPredictMode(st === "prever");
    p.setDoMode(st === "fazer");
    p.setExampleMode(st === "observar");

    if (st === "observar") {
      const script = observeScript(structure);
      scriptQueue.current = [...script.steps];
      scriptTotal.current = script.steps.length;
      setGoal(null);
      setDesafio(null);
      const initialNodes = nodesFromValues(script.initial);
      onNodesChange(initialNodes, structure);
      p.start(idleOp(structure, initialNodes, kind));
      // começa o roteiro após montar o estado inicial
      setTimeout(() => runNextScripted(initialNodes), 700);
      return;
    }
    if (st === "prever") {
      const base = observeResult.current ?? observeScript(structure).initial;
      const baseNodes = nodesFromValues(base);
      scriptQueue.current = [...previewScript(structure)];
      scriptTotal.current = scriptQueue.current.length;
      setGoal(null);
      setDesafio(null);
      onNodesChange(baseNodes, structure);
      p.start(idleOp(structure, baseNodes, kind));
      setTimeout(() => runNextScripted(baseNodes), 700);
      return;
    }
    if (st === "fazer") {
      const g = fazerGoal(structure);
      setGoal(g);
      setDesafio(null);
      onNodesChange([], structure);
      p.start(idleOp(structure, [], kind));
      return;
    }
    // desafio
    const d = desafioSpec(structure);
    setGoal(d);
    setDesafio(startDesafio(d.target, d.maxSteps, d.seconds));
    onNodesChange([], structure);
    p.start(idleOp(structure, [], kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure, kind]);

  // Reconfigura ao trocar de estágio, de estrutura ou de tipo de lista.
  useEffect(() => {
    setupStage(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, structure, kind]);

  // Relógio regressivo do Desafio.
  useEffect(() => {
    if (stage !== "desafio" || !desafio || desafio.status !== "running") return;
    const t = window.setInterval(() => setDesafio((d) => (d ? tick(d) : d)), 1000);
    return () => window.clearInterval(t);
  }, [stage, desafio]);

  const L = listOps(kind);
  // No Fazer e no Desafio, só as operações da meta ficam liberadas.
  const allowed = goal?.allowed;
  const can = (id: OpId) => !allowed || allowed.includes(id);
  const any = (...ids: OpId[]) => ids.some(can);

  const v = () => Number.parseInt(val, 10);
  const ps = () => Number.parseInt(pos, 10);
  const valid = !Number.isNaN(v());
  const posValid = !Number.isNaN(ps());

  // Painel de operações só aparece quando o aluno opera (Fazer e Desafio).
  const canOperate = stage === "fazer" || stage === "desafio";
  // No Desafio travado (venceu ou falhou), bloqueia novas operações.
  const desafioLocked = stage === "desafio" && desafio?.status !== "running";
  const opsDisabled = p.busy || desafioLocked;

  const idleStep = idleStepFor(structure, nodes, kind);
  const step = p.op ? p.step : idleStep;

  const run = (op: Op) => {
    if (opsDisabled) return;
    setExplained(null);
    p.start(op);
  };

  // Botão contextual embaixo do painel.
  const resetDesafio = () => {
    const d = desafioSpec(structure);
    setGoalDone(false);
    setDesafio(startDesafio(d.target, d.maxSteps, d.seconds));
    setExplained(null);
    onNodesChange([], structure);
    p.start(idleOp(structure, [], kind));
  };
  const clear = () => {
    setExplained(null);
    onNodesChange([], structure);
    p.start(idleOp(structure, [], kind));
  };

  return (
    <div className={styles.grid}>
      {canOperate ? (
        <aside className={styles.side} aria-label="Operações">
          <div className={styles.fields}>
            <label className={styles.fieldLabel}>
              Valor
              <Input value={val} onChange={(e) => setVal(e.target.value)} type="number" aria-invalid={!valid} />
            </label>
            {isList && any("insertAt", "removeAt") && (
              <label className={styles.fieldLabel}>
                Posição
                <Input value={pos} onChange={(e) => setPos(e.target.value)} type="number" min={0} aria-invalid={!posValid} />
              </label>
            )}
          </div>

          {isList ? (
            <>
              {onKindChange && (
                <div>
                  <div className={styles.groupTitle}>Tipo</div>
                  <div className={styles.kindRow}>
                    {(["simples", "dupla", "circular"] as ListKind[]).map((k) => (
                      <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} disabled={opsDisabled} onClick={() => onKindChange(k)} aria-pressed={kind === k}>
                        {k}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {any("insertHead", "insertTail", "insertAt") && (
                <Group title="Inserir">
                  {can("insertHead") && <Button disabled={!valid || opsDisabled} onClick={() => run(L.insertHead(nodes, v()))}>No início</Button>}
                  {can("insertTail") && <Button disabled={!valid || opsDisabled} onClick={() => run(L.insertTail(nodes, v()))}>No fim</Button>}
                  {can("insertAt") && <Button disabled={!valid || !posValid || opsDisabled} onClick={() => run(L.insertAt(nodes, ps(), v()))}>Na posição</Button>}
                </Group>
              )}
              {any("removeAt", "removeValue") && (
                <Group title="Remover">
                  {can("removeAt") && <Button variant="outline" disabled={!posValid || opsDisabled} onClick={() => run(L.removeAt(nodes, ps()))}>Da posição</Button>}
                  {can("removeValue") && <Button variant="outline" disabled={!valid || opsDisabled} onClick={() => run(L.removeValue(nodes, v()))}>Por valor</Button>}
                </Group>
              )}
              {can("search") && (
                <Group title="Percorrer">
                  <Button variant="secondary" disabled={!valid || opsDisabled} onClick={() => run(L.search(nodes, v()))}>Buscar valor</Button>
                </Group>
              )}
            </>
          ) : (
            <Group title="Operações">
              {can("push") && <Button disabled={!valid || opsDisabled} onClick={() => run(E.stackPush(nodes, v()))}>push</Button>}
              {can("pop") && <Button variant="outline" disabled={opsDisabled} onClick={() => run(E.stackPop(nodes))}>pop</Button>}
              {can("peek") && <Button variant="secondary" disabled={opsDisabled} onClick={() => run(E.stackPeek(nodes))}>peek</Button>}
              {can("isEmpty") && <Button variant="secondary" disabled={opsDisabled} onClick={() => run(E.stackIsEmpty(nodes))}>isEmpty</Button>}
            </Group>
          )}

          {stage === "desafio" ? (
            <Button variant="ghost" size="sm" className={styles.clear} onClick={resetDesafio}>
              Resetar desafio
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className={styles.clear} disabled={p.busy} onClick={clear}>
              Esvaziar estrutura
            </Button>
          )}
        </aside>
      ) : (
        <aside className={styles.sideQuiet} aria-label="Guia do estágio">
          <p className={styles.sideQuietText}>
            {stage === "observar"
              ? "Demonstração automática. Observe como cada operação muda a estrutura."
              : "Agora preveja: antes de cada passo-chave, diga o que vai acontecer."}
          </p>
        </aside>
      )}

      <section className={styles.main} aria-label="Visualização">
        <div className={styles.stageBar}>
          <div className={styles.stageSwitch} role="group" aria-label="Nível de apoio">
            {STAGES.map((st) => (
              <Button
                key={st}
                size="sm"
                variant={stage === st ? "default" : "outline"}
                aria-pressed={stage === st}
                disabled={p.busy}
                onClick={() => setScaffold((s) => setStage(s, st))}
              >
                {STAGE_LABEL[st]}
              </Button>
            ))}
          </div>
          <p className={styles.stageHint}>
            {STAGE_HINT[stage]}
            {remainingToAdvance(scaffold) > 0 && stage !== "desafio" && (
              <span className={styles.stageProgress}>
                {" "}Faltam {remainingToAdvance(scaffold)} acerto(s) sem dica para o próximo nível.
              </span>
            )}
          </p>
        </div>

        {/* Indicador do roteiro automático (Observar/Prever) */}
        {(stage === "observar" || stage === "prever") && scriptProgress && (
          <div className={styles.scriptBar} aria-live="polite">
            <span className={styles.scriptCount}>
              Operação {Math.min(scriptProgress.index, scriptProgress.total)} de {scriptProgress.total}
            </span>
            <span className={styles.scriptCaption}>{scriptProgress.caption}</span>
          </div>
        )}

        {/* Meta do Fazer */}
        {stage === "fazer" && goal && (
          <div className={goalDone ? styles.challengeDone : styles.challenge} aria-live="polite">
            <strong>{goalDone ? "Atividade concluída." : "Atividade"}</strong>{" "}
            {goalDone ? "Você chegou ao resultado esperado." : goal.prompt}
          </div>
        )}

        {/* Painel do Desafio: tempo, passos e meta */}
        {stage === "desafio" && desafio && goal && (
          <div
            className={
              desafio.status === "won" ? styles.challengeDone : desafio.status === "failed" ? styles.challengeFail : styles.challenge
            }
            aria-live="polite"
          >
            <div className={styles.desafioHead}>
              <strong>
                {desafio.status === "won" ? "Desafio concluído." : desafio.status === "failed" ? "Desafio não concluído." : "Desafio"}
              </strong>
              <span className={styles.desafioMeters}>
                <span aria-label="Tempo restante">⏱ {formatSeconds(desafio.secondsLeft)}</span>
                <span aria-label="Passos restantes">passos {stepsLeft(desafio)}/{desafio.maxSteps}</span>
              </span>
            </div>
            <div>
              {desafio.status === "won"
                ? "Você alcançou a meta dentro do tempo e dos passos."
                : desafio.status === "failed"
                  ? "Acabou o tempo ou os passos. Use \"Resetar desafio\" para tentar de novo."
                  : `${goal.prompt} Alvo: [${goal.target.join(", ") || "vazio"}].`}
            </div>
          </div>
        )}

        <div className={step?.error ? styles.messageErr : styles.message} aria-live="polite">
          {step?.message}
        </div>
        <div className={styles.stage}>
          {isList ? (
            <ListCanvas step={step} kind={kind} onPick={p.doAsking !== null && p.doAnswered[p.doAsking] === undefined ? p.answerDo : undefined} />
          ) : (
            <StackCanvas step={step} onPick={p.doAsking !== null && p.doAnswered[p.doAsking] === undefined ? p.answerDo : undefined} />
          )}
        </div>
        <ExampleBox p={p} />
        <PredictBox p={p} />
        <DoBox p={p} />
        {explained && (
          <SelfExplainBox
            key={`${explained.name}-${explained.final.length}`}
            op={explained}
            onSubmit={(text) => recordSelfExplanation(explained.structure, explained.name, text, explained.variant)}
          />
        )}
        <Controls p={p} />
      </section>

      <aside className={styles.codeAside} aria-label="Código">
        <div className={styles.detailRow} role="group" aria-label="Nível de detalhe">
          {(["essencial", "completo"] as const).map((d) => (
            <Button
              key={d}
              size="sm"
              variant={detail === d ? "default" : "outline"}
              aria-pressed={detail === d}
              onClick={() => setDetail(d)}
            >
              {d === "essencial" ? "Essencial" : "Completo"}
            </Button>
          ))}
        </div>
        <CodePanel p={p} showVars={detail === "completo"} />
      </aside>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className={styles.groupTitle}>{title}</div>
      <div className={styles.groupBody}>{children}</div>
    </div>
  );
}

/**
 * Autoexplicação após a operação: o aluno escreve em uma frase por que aquilo
 * aconteceu e depois compara com a explicação-modelo. É reflexão, não avaliação.
 */
function SelfExplainBox({ op, onSubmit }: { op: Op; onSubmit: (text: string) => void }) {
  const prompt = selfExplainFor(op.name);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  if (!prompt) return null;

  const finish = () => {
    onSubmit(text);
    setDone(true);
  };

  return (
    <div className={styles.selfExplain} aria-label="Explique com suas palavras">
      <p className={styles.selfExplainKicker}>Explique com suas palavras</p>
      <p className={styles.selfExplainQ}>{prompt.question}</p>
      {!done ? (
        <>
          <textarea
            className={styles.selfExplainInput}
            value={text}
            maxLength={240}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            placeholder="Opcional — uma ou duas frases."
            aria-label="Sua explicação"
          />
          <div className={styles.selfExplainActions}>
            <Button size="sm" variant="ghost" onClick={finish}>Pular</Button>
            <Button size="sm" onClick={finish}>Comparar</Button>
          </div>
        </>
      ) : (
        <div aria-live="polite">
          {text.trim() && <p className={styles.selfExplainMine}>Você escreveu: {text.trim()}</p>}
          <p className={styles.selfExplainModel}>
            <strong>Uma forma de explicar:</strong> {prompt.model}
          </p>
        </div>
      )}
    </div>
  );
}
