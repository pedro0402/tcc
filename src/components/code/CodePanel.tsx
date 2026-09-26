import { CODE_LANGS, type CodeLang } from "../../engine/code/languages";
import styles from "./CodePanel.module.css";

interface CodePanelProps {
  code: string;
  language: CodeLang;
  highlightedLine: number | null;
  error: string | null;
  onChange: (code: string) => void;
  onLanguageChange: (lang: CodeLang) => void;
}

export function CodePanel({
  code,
  language,
  highlightedLine,
  error,
  onChange,
  onLanguageChange,
}: CodePanelProps) {
  const lines = code.split("\n");
  const lineHeight = 22;
  const highlightTop =
    highlightedLine && highlightedLine > 0
      ? (highlightedLine - 1) * lineHeight
      : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.langs} role="tablist" aria-label="Linguagem">
        {CODE_LANGS.map((lang) => (
          <button
            key={lang.id}
            type="button"
            role="tab"
            aria-selected={language === lang.id}
            className={language === lang.id ? styles.langOn : styles.lang}
            onClick={() => onLanguageChange(lang.id)}
          >
            {lang.label}
          </button>
        ))}
      </div>
      <div className={styles.panel} role="region" aria-label="Editor de código">
        <div className={styles.gutterCol} aria-hidden="true">
          {lines.map((_, i) => (
            <span
              key={i}
              className={
                highlightedLine === i + 1 ? styles.gutterActive : styles.gutter
              }
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className={styles.editor}>
          {highlightTop !== null ? (
            <div
              className={styles.highlight}
              style={{ top: highlightTop, height: lineHeight }}
            />
          ) : null}
          <textarea
            className={styles.textarea}
            value={code}
            spellCheck={false}
            aria-label="Código da operação — edite para ver a estrutura mudar"
            onChange={(e) => onChange(e.target.value)}
            style={{ height: Math.max(lines.length + 1, 8) * lineHeight }}
          />
        </div>
      </div>
      {error ? (
        <p className={styles.error} role="status">
          {error}
        </p>
      ) : (
        <p className={styles.hint}>
          Edite o código: a visualização atualiza sozinha. push/pop, pilha[] e
          next são interpretados.
        </p>
      )}
    </div>
  );
}
