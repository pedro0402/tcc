import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as E from "../../engine/viva/engine";
import type { Node, Op, Step, Structure } from "../../engine/viva/engine";
import type { OpId } from "../../engine/viva/opIds";
import { usePlayer, type PredictEvent } from "../viva/usePlayer";
import { CodePanel, Controls, PredictBox } from "../viva/Player";
import { ListCanvas, StackCanvas, type ListKind } from "../viva/Canvas";
import { Button, Input } from "../viva/ui";
import styles from "../viva/viva.module.css";

/** Nome da operação "vazia" que só exibe o estado atual. Não conta como progresso. */
export const IDLE = "idle";

export const idleOp = (structure: Structure, nodes: Node[]): Op => ({
  name: IDLE,
  structure,
  code: [],
  final: nodes,
  steps: [
    {
      line: -1,
      nodes,
      pointers: {},
      highlight: [],
      message: "Escolha uma operação para começar.",
      vars: {},
    },
  ],
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
  onOpDone,
  onPredict,
  onBusyChange,
}: LabWorkspaceProps) {
  const isList = structure === "linkedList";
  const [val, setVal] = useState("42");
  const [pos, setPos] = useState("1");

  // Callbacks por ref: o player recebe funções estáveis mesmo se o pai recriar as suas.
  const nodesChangeRef = useRef(onNodesChange);
  const opDoneRef = useRef(onOpDone);
  const predictRef = useRef(onPredict);
  nodesChangeRef.current = onNodesChange;
  opDoneRef.current = onOpDone;
  predictRef.current = onPredict;

  const handleDone = useCallback((op: Op) => {
    nodesChangeRef.current(op.final, op.structure);
    if (op.name === IDLE) return;
    opDoneRef.current?.(op);
  }, []);
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
    p.start(idleOp(structure, nodes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure]);

  const can = (id: OpId) => !allowed || allowed.includes(id);
  const any = (...ids: OpId[]) => ids.some(can);

  const v = () => Number.parseInt(val, 10);
  const ps = () => Number.parseInt(pos, 10);
  const valid = !Number.isNaN(v());
  const posValid = !Number.isNaN(ps());

  const idleStep: Step = {
    line: -1,
    nodes,
    pointers: { [isList ? "cabeca" : "topo"]: nodes.length ? 0 : null },
    highlight: [],
    message: "Escolha uma operação para começar.",
    vars: {},
  };
  const step = p.op ? p.step : idleStep;

  const run = (op: Op) => {
    if (!p.busy) p.start(op);
  };

  const clear = () => {
    onNodesChange([], structure);
    p.start(idleOp(structure, []));
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
                    <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => onKindChange(k)} aria-pressed={kind === k}>
                      {k}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {any("insertHead", "insertTail", "insertAt") && (
              <Group title="Inserir">
                {can("insertHead") && <Button disabled={!valid || p.busy} onClick={() => run(E.listInsertHead(nodes, v()))}>No início</Button>}
                {can("insertTail") && <Button disabled={!valid || p.busy} onClick={() => run(E.listInsertTail(nodes, v()))}>No fim</Button>}
                {can("insertAt") && <Button disabled={!valid || !posValid || p.busy} onClick={() => run(E.listInsertAt(nodes, ps(), v()))}>Na posição</Button>}
              </Group>
            )}
            {any("removeAt", "removeValue") && (
              <Group title="Remover">
                {can("removeAt") && <Button variant="outline" disabled={!posValid || p.busy} onClick={() => run(E.listRemoveAt(nodes, ps()))}>Da posição</Button>}
                {can("removeValue") && <Button variant="outline" disabled={!valid || p.busy} onClick={() => run(E.listRemoveValue(nodes, v()))}>Por valor</Button>}
              </Group>
            )}
            {can("search") && (
              <Group title="Percorrer">
                <Button variant="secondary" disabled={!valid || p.busy} onClick={() => run(E.listSearch(nodes, v()))}>Buscar valor</Button>
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
        <Controls p={p} />
      </section>

      <aside className={styles.codeAside} aria-label="Código">
        <CodePanel p={p} />
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
