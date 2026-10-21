import { useCallback, useEffect, useState } from "react";
import type { Node, Op, Structure } from "../engine/viva/engine";
import type { PredictEvent } from "../components/viva/usePlayer";
import { LabWorkspace } from "../components/lab/LabWorkspace";
import { recordOperationComplete, recordPrediction } from "../persistence/localProgress";
import { syncProgressToApi } from "../api/progressClient";
import { hrefFor, parseHashParams } from "../routing/useHashRoute";
import { labLabel, parseLabParams, type LabTarget } from "../routing/labParams";
import styles from "../components/viva/viva.module.css";

// Tela de operações portada do EstruturaViva (src/routes/index.tsx),
// integrada ao roteamento por hash e ao progresso do ds-visualizer.
// O simulador em si vive em components/lab/LabWorkspace.
//
// A estrutura e o tipo de lista vêm da URL (#/lab?s=list&k=dupla), escolhidos
// na página de estruturas. Para trocar, o aluno volta a essa página.

const targetFromHash = (): LabTarget => parseLabParams(parseHashParams(window.location.hash));
const sameTarget = (a: LabTarget, b: LabTarget) => a.structure === b.structure && a.kind === b.kind;

export function LabPage() {
  const [target, setTarget] = useState<LabTarget>(targetFromHash);
  // O simulador começa vazio: o aluno monta a estrutura com as operações
  // (ou pelo campo "Estado inicial").
  const [list, setList] = useState<Node[]>([]);
  const [stack, setStack] = useState<Node[]>([]);
  const [busy, setBusy] = useState(false);

  const onNodesChange = useCallback((nodes: Node[], structure: Structure) => {
    (structure === "linkedList" ? setList : setStack)(nodes);
  }, []);
  const onOpDone = useCallback((op: Op) => {
    recordOperationComplete(op.structure, op.name, op.variant);
    // Endpoint antigo de progresso: lista dupla/circular ganha o tipo no nome.
    const label = op.variant && op.variant !== "simples" ? `${op.name} (${op.variant})` : op.name;
    void syncProgressToApi(op.structure, label);
  }, []);
  const onPredict = useCallback((e: PredictEvent) => {
    recordPrediction(e.op.structure, e.op.name, e.correct, e.op.variant, {
      concept: e.concept,
      misconception: e.misconception,
      confidence: e.confidence,
    });
  }, []);

  // A URL pode mudar com o simulador aberto (voltar/avançar do navegador).
  // Com uma operação em andamento a troca espera; ao terminar, a tela volta a
  // refletir a URL.
  useEffect(() => {
    const apply = () => {
      const next = targetFromHash();
      if (!busy) setTarget((cur) => (sameTarget(cur, next) ? cur : next));
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [busy]);

  const { structure, kind } = target;

  return (
    <div className={styles.root}>
      {/* Sem cabeçalho próprio: a marca já está na barra do site. */}
      <LabWorkspace
        toolbar={
          <div className={styles.structureInfo}>
            <span className={styles.structureName}>{labLabel(target)}</span>
            {/* Sair para a escolha desmonta o simulador: pode ser feito a qualquer momento. */}
            <a className={styles.structureSwitch} href={hrefFor("estruturas")}>Trocar estrutura</a>
          </div>
        }
        structure={structure}
        kind={kind}
        nodes={structure === "linkedList" ? list : stack}
        onNodesChange={onNodesChange}
        onOpDone={onOpDone}
        onPredict={onPredict}
        onBusyChange={setBusy}
      />
    </div>
  );
}
