import type { StructureType } from "../../engine/types";
import styles from "./MissionBanner.module.css";

interface MissionBannerProps {
  structureType: StructureType;
  pushDone: boolean;
  popDone: boolean;
  insertDone: boolean;
  removeDone: boolean;
  complete: boolean;
}

export function MissionBanner({
  structureType,
  pushDone,
  popDone,
  insertDone,
  removeDone,
  complete,
}: MissionBannerProps) {
  if (structureType === "stack") {
    return (
      <div className={complete ? styles.done : styles.bar}>
        <strong>Missão LIFO</strong>
        <span>
          1) Faça um Push {pushDone ? "✓" : ""} · 2) Faça um Pop {popDone ? "✓" : ""}
        </span>
        <em>
          {complete
            ? "O valor que saiu é o que você tinha acabado de colocar — isso é LIFO."
            : "O último a entrar deve ser o primeiro a sair."}
        </em>
      </div>
    );
  }

  return (
    <div className={complete ? styles.done : styles.bar}>
      <strong>Missão head</strong>
      <span>
        1) Insert Head {insertDone ? "✓" : ""} · 2) Remove {removeDone ? "✓" : ""}
      </span>
      <em>
        {complete
          ? "Você viu o head mudar e o next religar. Isso é a lista encadeada."
          : "O head é a porta. Inserir no início não percorre o resto."}
      </em>
    </div>
  );
}
