import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as E from "../../engine/viva/engine";
import type { Node, Op, Step, Structure } from "../../engine/viva/engine";
import type { OpId } from "../../engine/viva/opIds";
import { listOps } from "../../engine/viva/lists";
import { chain } from "../../engine/viva/links";
import { nodesFromValues, nodesToText, parseInitialState } from "../../engine/viva/initialState";
import { selfExplainFor } from "../../content/selfExplain";
import { recordSelfExplanation } from "../../persistence/localProgress";
import { usePlayer, type PredictEvent } from "../viva/usePlayer";
import { CodePanel, Controls, PredictBox } from "../viva/Player";
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
    // Lista dupla/circular: mostra as ligações reais (null nas pontas, retorno à cabeça).
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
  /** Variante da lista (só desenho por enquanto). */
  kind?: ListKind;
  /** Se informado, mostra o seletor de tipo de lista. */
  onKindChange?: (kind: ListKind) => void;
  /** Estado atual da estrutura (controlado por quem usa o componente). */
  nodes: Node[];
  onNodesChange: (nodes: Node[], structure: Structure) => void;
  /** Operações liberadas. Sem este campo, todas aparecem. */
  allowed?: OpId[];
  /** Mostra o botão "Esvaziar estrutura". Padrão: sim. */
  allowClear?: boolean;
  /** Oferece a autoexplicação ao fim de cada operação. Padrão: sim. */
  selfExplain?: boolean;
  /** Chamado quando uma operação (exceto a ociosa) chega ao fim. */
  onOpDone?: (op: Op) => void;
  onPredict?: (event: PredictEvent) => void;
  /** Avisa quando há operação em andamento (para travar troca de aba etc.). */
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Simulador completo (operações, visualização, previsão, controles e código).
 * É a peça reutilizada pelo Laboratório e pelas atividades de prática.
 */
export function LabWorkspace({
  structure,
  kind = "simples",
  onKindChange,
  nodes,
  onNodesChange,
  allowed,
  allowClear = true,
  selfExplain = true,
  onOpDone,
  onPredict,
  onBusyChange,
}: LabWorkspaceProps) {
  const isList = structure === "linkedList";
  const [val, setVal] = useState("42");
  const [pos, setPos] = useState("1");
  // Nível de detalhe: "essencial" esconde o painel de variáveis para reduzir a
  // carga cognitiva (TCAM/Sweller); "completo" mostra tudo.
  const [detail, setDetail] = useState<"essencial" | "completo">("completo");

  // Callbacks por ref: o player recebe funções estáveis mesmo se o pai recriar as suas.
  const nodesChangeRef = useRef(onNodesChange);
  const opDoneRef = useRef(onOpDone);
  const predictRef = useRef(onPredict);
  nodesChangeRef.current = onNodesChange;
  opDoneRef.current = onOpDone;
  predictRef.current = onPredict;

  // Operação recém-concluída (sem erro), para oferecer a autoexplicação.
  const [explained, setExplained] = useState<Op | null>(null);

  const handleDone = useCallback((op: Op) => {
    nodesChangeRef.current(op.final, op.structure);
    if (op.name === IDLE) return;
    opDoneRef.current?.(op);
    const hadError = op.steps.some((s) => s.error);
    setExplained(selfExplain && !hadError && selfExplainFor(op.name) ? op : null);
  }, [selfExplain]);
  const handlePredict = useCallback((e: PredictEvent) => predictRef.current?.(e), []);
  const p = usePlayer({ onDone: handleDone, onPredict: handlePredict });

  useEffect(() => {
    onBusyChange?.(p.busy);
  }, [p.busy, onBusyChange]);

  // Ao trocar de estrutura, volta ao estado ocioso da nova estrutura.
  const lastStructure = useRef(structure);
  useEffect(() => {
    if (lastStructure.current === structure) return;
    lastStructure.current = structure;
    p.start(idleOp(structure, nodes, kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure]);

  // Ao trocar o tipo da lista (simples/dupla/circular), limpa a visualização
  // da operação anterior, que pertence a outro tipo.
  const lastKind = useRef(kind);
  useEffect(() => {
    if (lastKind.current === kind) return;
    lastKind.current = kind;
    if (!p.busy) p.start(idleOp(structure, nodes, kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const L = listOps(kind);
  const can = (id: OpId) => !allowed || allowed.includes(id);
  const any = (...ids: OpId[]) => ids.some(can);

  const v = () => Number.parseInt(val, 10);
  const ps = () => Number.parseInt(pos, 10);
  const valid = !Number.isNaN(v());
  const posValid = !Number.isNaN(ps());

  const idleStep = idleStepFor(structure, nodes, kind);
  const step = p.op ? p.step : idleStep;

  const run = (op: Op) => {
    if (p.busy) return;
    setExplained(null);
    p.start(op);
  };

  const clear = () => {
    setExplained(null);
    onNodesChange([], structure);
    p.start(idleOp(structure, [], kind));
  };

  // Define o estado inicial da estrutura a partir de uma lista de valores.
  const applyInitial = (values: number[]) => {
    setExplained(null);
    const next = nodesFromValues(values);
    onNodesChange(next, structure);
    p.start(idleOp(structure, next, kind));
  };

  return (
    <div className={styles.grid}>
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
                    <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} disabled={p.busy} onClick={() => onKindChange(k)} aria-pressed={kind === k}>
                      {k}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {any("insertHead", "insertTail", "insertAt") && (
              <Group title="Inserir">
                {can("insertHead") && <Button disabled={!valid || p.busy} onClick={() => run(L.insertHead(nodes, v()))}>No início</Button>}
                {can("insertTail") && <Button disabled={!valid || p.busy} onClick={() => run(L.insertTail(nodes, v()))}>No fim</Button>}
                {can("insertAt") && <Button disabled={!valid || !posValid || p.busy} onClick={() => run(L.insertAt(nodes, ps(), v()))}>Na posição</Button>}
              </Group>
            )}
            {any("removeAt", "removeValue") && (
              <Group title="Remover">
                {can("removeAt") && <Button variant="outline" disabled={!posValid || p.busy} onClick={() => run(L.removeAt(nodes, ps()))}>Da posição</Button>}
                {can("removeValue") && <Button variant="outline" disabled={!valid || p.busy} onClick={() => run(L.removeValue(nodes, v()))}>Por valor</Button>}
              </Group>
            )}
            {can("search") && (
              <Group title="Percorrer">
                <Button variant="secondary" disabled={!valid || p.busy} onClick={() => run(L.search(nodes, v()))}>Buscar valor</Button>
              </Group>
            )}
          </>
        ) : (
          <>
            <Group title="Operações">
              {can("push") && <Button disabled={!valid || p.busy} onClick={() => run(E.stackPush(nodes, v()))}>push</Button>}
              {can("pop") && <Button variant="outline" disabled={p.busy} onClick={() => run(E.stackPop(nodes))}>pop</Button>}
              {can("peek") && <Button variant="secondary" disabled={p.busy} onClick={() => run(E.stackPeek(nodes))}>peek</Button>}
              {can("isEmpty") && <Button variant="secondary" disabled={p.busy} onClick={() => run(E.stackIsEmpty(nodes))}>isEmpty</Button>}
            </Group>
            {can("pop") && (
              <p className={styles.hint}>
                LIFO: o último a entrar é o primeiro a sair. Tente <b>pop</b> com a pilha vazia para ver o underflow.
              </p>
            )}
          </>
        )}
        <InitialStateEditor nodes={nodes} disabled={p.busy} onApply={applyInitial} />

        {allowClear && (
          <Button variant="ghost" size="sm" className={styles.clear} disabled={p.busy} onClick={clear}>
            Esvaziar estrutura
          </Button>
        )}
      </aside>

      <section className={styles.main} aria-label="Visualização">
        <div className={step?.error ? styles.messageErr : styles.message} aria-live="polite">
          {step?.message}
        </div>
        <div className={styles.stage}>
          {isList ? <ListCanvas step={step} kind={kind} /> : <StackCanvas step={step} />}
        </div>
        <PredictBox p={p} />
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
 * aconteceu e depois compara com a explicação-modelo. É reflexão, não avaliação:
 * a resposta é opcional e o texto fica só no navegador.
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

/**
 * Edita o estado inicial da estrutura (uma lista de valores). Permite comparar
 * casos: lista vazia, um elemento, remoção do head etc. (nível "changing" de Naps).
 * O campo começa sincronizado com o estado atual e avisa valores inválidos.
 */
function InitialStateEditor({
  nodes,
  disabled,
  onApply,
}: {
  nodes: Node[];
  disabled: boolean;
  onApply: (values: number[]) => void;
}) {
  const current = nodesToText(nodes);
  const [text, setText] = useState(current);
  const [touched, setTouched] = useState(false);
  // Enquanto o usuário não mexe, o campo acompanha o estado atual da estrutura.
  const shown = touched ? text : current;
  const parsed = parseInitialState(shown);
  const changed = parsed.ok && nodesToText(nodesFromValues(parsed.values)) !== current;

  return (
    <Group title="Estado inicial">
      <div className={styles.initialRow}>
        <Input
          value={shown}
          onChange={(e) => {
            setTouched(true);
            setText(e.target.value);
          }}
          aria-label="Valores da estrutura, separados por vírgula ou espaço"
          aria-invalid={!parsed.ok}
          placeholder="ex.: 3, 8, 15"
        />
        <Button
          size="sm"
          disabled={disabled || !parsed.ok || !changed}
          onClick={() => {
            if (parsed.ok) {
              onApply(parsed.values);
              setTouched(false);
            }
          }}
        >
          Aplicar
        </Button>
      </div>
      {!parsed.ok && <p className={styles.initialError}>{parsed.error}</p>}
      <p className={styles.initialHint}>Troque os valores para comparar casos (vazia, um nó, remoção da cabeça).</p>
    </Group>
  );
}
