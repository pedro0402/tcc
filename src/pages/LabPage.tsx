import { useCallback, useEffect, useState } from "react";
import * as E from "../engine/viva/engine";
import type { Node, Op, Structure } from "../engine/viva/engine";
import type { PredictEvent } from "../components/viva/usePlayer";
import type { ListKind } from "../components/viva/Canvas";
import { LabWorkspace } from "../components/lab/LabWorkspace";
import { recordOperationComplete, recordPrediction } from "../persistence/localProgress";
import { syncProgressToApi } from "../api/progressClient";
import styles from "../components/viva/viva.module.css";

// Tela de operações portada do EstruturaViva (src/routes/index.tsx),
// integrada ao roteamento por hash e ao progresso do ds-visualizer.
// O simulador em si vive em components/lab/LabWorkspace.

type Tab = "lista" | "pilha";

function tabFromHash(): Tab {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("s") === "stack" ? "pilha" : "lista";
}

export function LabPage() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [kind, setKind] = useState<ListKind>("simples");
  const [list, setList] = useState<Node[]>(() => [3, 8, 15].map(E.mk));
  const [stack, setStack] = useState<Node[]>(() => [12, 7].map(E.mk));
  const [busy, setBusy] = useState(false);

  const onNodesChange = useCallback((nodes: Node[], structure: Structure) => {
    (structure === "linkedList" ? setList : setStack)(nodes);
  }, []);
  const onOpDone = useCallback((op: Op) => {
    // Lista dupla/circular ganha o sufixo para não se misturar com a simples.
    const label = op.variant && op.variant !== "simples" ? `${op.name} (${op.variant})` : op.name;
    recordOperationComplete(op.structure, label);
    void syncProgressToApi(op.structure, label);
  }, []);
  const onPredict = useCallback((e: PredictEvent) => {
    recordPrediction(e.op.structure, e.op.name, e.correct);
  }, []);

  const switchTab = (t: Tab, syncHash = true) => {
    if (busy) return;
    setTab(t);
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

  const structure: Structure = tab === "lista" ? "linkedList" : "stack";

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
              disabled={busy && tab !== t}
              onClick={() => switchTab(t)}
              className={tab === t ? styles.tabOn : styles.tab}
            >
              {t === "lista" ? "Lista encadeada" : "Pilha"}
            </button>
          ))}
        </nav>
      </header>

      <LabWorkspace
        structure={structure}
        kind={kind}
        onKindChange={setKind}
        nodes={tab === "lista" ? list : stack}
        onNodesChange={onNodesChange}
        onOpDone={onOpDone}
        onPredict={onPredict}
        onBusyChange={setBusy}
      />
    </div>
  );
}
