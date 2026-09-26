import { useCallback, useEffect, useState, type ReactNode } from "react";
import * as E from "../engine/viva/engine";
import type { Node, Op } from "../engine/viva/engine";
import { usePlayer } from "../components/viva/usePlayer";
import { CodePanel, Controls, PredictBox } from "../components/viva/Player";
import { ListCanvas, StackCanvas, type ListKind } from "../components/viva/Canvas";
import { Button, Input } from "../components/viva/ui";
import { recordOperationComplete, recordPrediction } from "../persistence/localProgress";
import { syncProgressToApi } from "../api/progressClient";
import styles from "../components/viva/viva.module.css";

// Tela de operações portada do EstruturaViva (src/routes/index.tsx),
// integrada ao roteamento por hash e ao progresso do ds-visualizer.

type Tab = "lista" | "pilha";
const IDLE = "idle";

function tabFromHash(): Tab {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("s") === "stack" ? "pilha" : "lista";
}

const idleOp = (structure: E.Structure, nodes: Node[]): Op => ({
  name: IDLE,
  structure,
  code: [],
  final: nodes,
  steps: [{ line: -1, nodes, pointers: {}, highlight: [], message: "Escolha uma operação para começar.", vars: {} }],
});

export function LabPage() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [kind, setKind] = useState<ListKind>("simples");
  const [list, setList] = useState<Node[]>(() => [3, 8, 15].map(E.mk));
  const [stack, setStack] = useState<Node[]>(() => [12, 7].map(E.mk));
  const [val, setVal] = useState("42");
  const [pos, setPos] = useState("1");

  const onDone = useCallback((op: Op) => {
    (op.structure === "linkedList" ? setList : setStack)(op.final);
    if (op.name === IDLE) return;
    recordOperationComplete(op.structure, op.name);
    void syncProgressToApi(op.structure, op.name);
  }, []);
  const onPredict = useCallback((op: Op, correct: boolean) => {
    recordPrediction(op.structure, op.name, correct);
  }, []);
  const p = usePlayer({ onDone, onPredict });

  const v = () => Number.parseInt(val, 10);
  const ps = () => Number.parseInt(pos, 10);
  const valid = !Number.isNaN(v());
  const posValid = !Number.isNaN(ps());
  const cur = tab === "lista" ? list : stack;
  const idleStep: E.Step = {
    line: -1,
    nodes: cur,
    pointers: { [tab === "lista" ? "cabeca" : "topo"]: cur.length ? 0 : null },
    highlight: [],
    message: "Escolha uma operação para começar.",
    vars: {},
  };
  const step = p.op ? p.step : idleStep;
  const run = (op: Op) => {
    if (!p.busy) p.start(op);
  };

  const switchTab = (t: Tab, syncHash = true) => {
    if (p.busy) return;
    setTab(t);
    p.start(idleOp(t === "lista" ? "linkedList" : "stack", t === "lista" ? list : stack));
    if (syncHash) window.location.hash = t === "lista" ? "#/lab?s=list" : "#/lab?s=stack";
  };

  // Links externos (Home, Aprender) trocam a aba via hash.
  useEffect(() => {
    const onHash = () => {
      const t = tabFromHash();
      if (t !== tab) switchTab(t, false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  });

  const clear = () => {
    const structure: E.Structure = tab === "lista" ? "linkedList" : "stack";
    (tab === "lista" ? setList : setStack)([]);
    p.start(idleOp(structure, []));
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.brand}>
            Estrutura<span className={styles.brandAccent}>Viva</span>
          </h1>
          <p className={styles.tagline}>Veja o código e a estrutura mudarem juntos — e tente prever o próximo passo.</p>
        </div>
        <nav className={styles.tabs} role="tablist" aria-label="Estrutura">
          {(["lista", "pilha"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              disabled={p.busy && tab !== t}
              onClick={() => switchTab(t)}
              className={tab === t ? styles.tabOn : styles.tab}
            >
              {t === "lista" ? "Lista encadeada" : "Pilha"}
            </button>
          ))}
        </nav>
      </header>

      <div className={styles.grid}>
        <aside className={styles.side} aria-label="Operações">
          <div className={styles.fields}>
            <label className={styles.fieldLabel}>
              Valor
              <Input value={val} onChange={(e) => setVal(e.target.value)} type="number" aria-invalid={!valid} />
            </label>
            {tab === "lista" && (
              <label className={styles.fieldLabel}>
                Posição
                <Input value={pos} onChange={(e) => setPos(e.target.value)} type="number" min={0} aria-invalid={!posValid} />
              </label>
            )}
          </div>

          {tab === "lista" ? (
            <>
              <div>
                <div className={styles.groupTitle}>Tipo</div>
                <div className={styles.kindRow}>
                  {(["simples", "dupla", "circular"] as ListKind[]).map((k) => (
                    <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} aria-pressed={kind === k}>
                      {k}
                    </Button>
                  ))}
                </div>
              </div>
              <Group title="Inserir">
                <Button disabled={!valid || p.busy} onClick={() => run(E.listInsertHead(list, v()))}>No início</Button>
                <Button disabled={!valid || p.busy} onClick={() => run(E.listInsertTail(list, v()))}>No fim</Button>
                <Button disabled={!valid || !posValid || p.busy} onClick={() => run(E.listInsertAt(list, ps(), v()))}>Na posição</Button>
              </Group>
              <Group title="Remover">
                <Button variant="outline" disabled={!posValid || p.busy} onClick={() => run(E.listRemoveAt(list, ps()))}>Da posição</Button>
                <Button variant="outline" disabled={!valid || p.busy} onClick={() => run(E.listRemoveValue(list, v()))}>Por valor</Button>
              </Group>
              <Group title="Percorrer">
                <Button variant="secondary" disabled={!valid || p.busy} onClick={() => run(E.listSearch(list, v()))}>Buscar valor</Button>
              </Group>
            </>
          ) : (
            <>
              <Group title="Operações">
                <Button disabled={!valid || p.busy} onClick={() => run(E.stackPush(stack, v()))}>push</Button>
                <Button variant="outline" disabled={p.busy} onClick={() => run(E.stackPop(stack))}>pop</Button>
                <Button variant="secondary" disabled={p.busy} onClick={() => run(E.stackPeek(stack))}>peek</Button>
                <Button variant="secondary" disabled={p.busy} onClick={() => run(E.stackIsEmpty(stack))}>isEmpty</Button>
              </Group>
              <p className={styles.hint}>
                LIFO: o último a entrar é o primeiro a sair. Tente <b>pop</b> com a pilha vazia para ver o underflow.
              </p>
            </>
          )}
          <Button variant="ghost" size="sm" className={styles.clear} disabled={p.busy} onClick={clear}>
            Esvaziar estrutura
          </Button>
        </aside>

        <section className={styles.main} aria-label="Visualização">
          <div className={step?.error ? styles.messageErr : styles.message} aria-live="polite">
            {step?.message}
          </div>
          <div className={styles.stage}>
            {tab === "lista" ? <ListCanvas step={step} kind={kind} /> : <StackCanvas step={step} />}
          </div>
          <PredictBox p={p} />
          <Controls p={p} />
        </section>

        <aside className={styles.codeAside} aria-label="Código">
          <CodePanel p={p} />
        </aside>
      </div>
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
