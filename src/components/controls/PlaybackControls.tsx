import styles from "./PlaybackControls.module.css";

interface PlaybackControlsProps {
  onBack: () => void;
  onForward: () => void;
  onPlay: () => void;
  onPause: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  canPlay: boolean;
  isPlaying: boolean;
  speed: number;
  onSpeedChange: (ms: number) => void;
  current: number;
  total: number;
  caption: string;
}

export function PlaybackControls({
  onBack,
  onForward,
  onPlay,
  onPause,
  canGoBack,
  canGoForward,
  canPlay,
  isPlaying,
  speed,
  onSpeedChange,
  current,
  total,
  caption,
}: PlaybackControlsProps) {
  const ratio = total > 0 ? current / total : 0;
  const label =
    speed <= 450 ? "2x" : speed <= 900 ? "1x" : "0.5x";

  return (
    <div className={styles.bar}>
      <label className={styles.speed}>
        <input
          type="range"
          min={450}
          max={1400}
          step={1}
          value={1850 - speed}
          aria-label="Velocidade de reprodução"
          onChange={(e) => onSpeedChange(1850 - Number(e.target.value))}
        />
        <span>{label}</span>
      </label>

      <div className={styles.transport}>
        <button type="button" onClick={onBack} disabled={!canGoBack} aria-label="Passo anterior">
          ⏮
        </button>
        {isPlaying ? (
          <button type="button" onClick={onPause} aria-label="Pausar">
            ⏸
          </button>
        ) : (
          <button type="button" onClick={onPlay} disabled={!canPlay} aria-label="Reproduzir">
            ▶
          </button>
        )}
        <button type="button" onClick={onForward} disabled={!canGoForward} aria-label="Próximo passo">
          ⏭
        </button>
      </div>

      <div className={styles.progress}>
        <div className={styles.track} aria-hidden>
          <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className={styles.caption} aria-live="polite">
          {total ? `${current}/${total} · ${caption}` : caption}
        </p>
      </div>
    </div>
  );
}
