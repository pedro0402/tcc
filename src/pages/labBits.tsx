import { LIST_LESSON, STACK_LESSON } from "../content/lessons";
import styles from "./LabPage.module.css";

interface LessonStripProps {
  structureType: "stack" | "linkedList";
}

export function LessonStrip({ structureType }: LessonStripProps) {
  const lesson = structureType === "stack" ? STACK_LESSON : LIST_LESSON;
  return (
    <aside className={structureType === "stack" ? styles.strip : styles.stripAmber}>
      <div>
        <span>{lesson.badge}</span>
        <h2>{lesson.title}</h2>
      </div>
      <p>{lesson.lead}</p>
    </aside>
  );
}

interface StepMetaProps {
  current: number;
  total: number;
  kind?: string;
}

export function StepMeta({ current, total, kind }: StepMetaProps) {
  const ratio = total > 0 ? current / total : 0;
  return (
    <div className={styles.meta}>
      <div className={styles.metaRow}>
        <span>
          Passo {Math.max(current, 0)} de {total || 0}
        </span>
        {kind ? <span className={styles.kind}>{kind}</span> : null}
      </div>
      <div className={styles.bar} aria-hidden>
        <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
