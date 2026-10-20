import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./viva.module.css";

/**
 * Escala para caber: quanto o conteúdo precisa encolher para caber na caixa.
 * Nunca amplia (máximo 1). Medidas inválidas (0, NaN) devolvem 1.
 */
export function fitScale(box: { width: number; height: number }, content: { width: number; height: number }): number {
  const s = Math.min(1, box.width / content.width, box.height / content.height);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

/**
 * Mostra o desenho inteiro dentro da área disponível, sem barra de rolagem:
 * se a estrutura não couber (pilha alta, lista longa, janela baixa), ela é
 * reduzida proporcionalmente. Os nós continuam clicáveis (estágio Fazer).
 */
export function FitToBox({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // offsetWidth/Height ignoram o transform: é o tamanho natural do desenho.
  const update = () => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    setScale(fitScale({ width: o.clientWidth, height: o.clientHeight }, { width: i.offsetWidth, height: i.offsetHeight }));
  };

  // A cada render (o desenho muda a cada passo) mede antes da pintura;
  // se a escala não mudar, o React descarta o setState.
  useLayoutEffect(update);

  // Mudanças que não passam por este componente: janela redimensionada,
  // caixa de pergunta abrindo embaixo do desenho, fontes carregando.
  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => update());
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={outer} className={styles.fit}>
      <div ref={inner} className={styles.fitInner} style={scale < 1 ? { transform: `scale(${scale})` } : undefined}>
        {children}
      </div>
    </div>
  );
}
