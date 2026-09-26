import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import styles from "./viva.module.css";

// Equivalentes leves dos componentes shadcn usados no EstruturaViva
// (Button, Input, Slider, Switch), sem Tailwind nem Radix.

type Variant = "default" | "outline" | "secondary" | "ghost";
type Size = "default" | "sm" | "icon";

export function Button({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const cls = [styles.btn, styles[`btn_${variant}`], styles[`size_${size}`], className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={cls} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[styles.input, className].filter(Boolean).join(" ")} {...props} />;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: ReactNode;
}) {
  return (
    <label className={styles.switchLabel}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={checked ? styles.switchOn : styles.switch}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className={styles.switchThumb} />
      </button>
      {label}
    </label>
  );
}

export function Slider(props: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const pct = ((props.value - props.min) / (props.max - props.min)) * 100;
  return (
    <input
      type="range"
      className={styles.slider}
      style={{ ["--pct" as string]: `${pct}%` }}
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      aria-label={props.label}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  );
}

const ICONS = {
  restart: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  prev: <path d="m15 18-6-6 6-6" />,
  next: <path d="m9 18 6-6-6-6" />,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  pause: (
    <>
      <rect x="14" y="4" width="4" height="16" rx="1" />
      <rect x="6" y="4" width="4" height="16" rx="1" />
    </>
  ),
  skip: (
    <>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" x2="19" y1="5" y2="19" />
    </>
  ),
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
