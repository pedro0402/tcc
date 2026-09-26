import styles from "./OperationSelector.module.css";

interface InputEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export function InputEditor({
  value,
  onChange,
  disabled,
  label = "Valor",
}: InputEditorProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </label>
  );
}
