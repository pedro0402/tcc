import type { NextFunction, Request, Response } from "express";

export interface RateLimitOptions {
  /** Janela em milissegundos. */
  windowMs: number;
  /** Máximo de requisições por chave dentro da janela. */
  max: number;
}

/**
 * Limitador em memória de janela fixa. Suficiente para uma instância única;
 * com várias instâncias, troque por um armazenamento compartilhado (ex.: Redis).
 */
export function rateLimit(
  opts: RateLimitOptions,
  keyOf: (req: Request) => string,
  now: () => number = Date.now,
) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const t = now();
    // Limpeza preguiçosa para o mapa não crescer sem limite.
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    }
    const key = keyOf(req);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      entry = { count: 0, resetAt: t + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - t) / 1000).toString());
      return res.status(429).json({ error: "too_many_requests" });
    }
    next();
  };
}
