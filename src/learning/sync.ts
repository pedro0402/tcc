import type { EventStore, LearningEvent } from "./events";

/** ok = servidor aceitou; retry = tentar de novo depois; drop = lote recusado, descartar. */
export type SendResult = "ok" | "retry" | "drop";

export interface SyncDeps {
  store: EventStore;
  send: (events: LearningEvent[]) => Promise<SendResult>;
  /** Espera antes de enviar, para agrupar vários eventos num só pedido. */
  delayMs?: number;
  /** Eventos por pedido (o servidor aceita até 100). */
  batchSize?: number;
}

export interface EventSync {
  /** Envia o que estiver pendente agora. Chamadas simultâneas se juntam. */
  flush(): Promise<void>;
  /** Passa a enviar sozinho quando houver eventos novos. Devolve a função que para. */
  start(): () => void;
}

const MAX_BATCHES_PER_FLUSH = 50;

export function createEventSync({ store, send, delayMs = 2000, batchSize = 100 }: SyncDeps): EventSync {
  let running: Promise<void> | null = null;

  async function run(): Promise<void> {
    for (let i = 0; i < MAX_BATCHES_PER_FLUSH; i++) {
      const batch = store.pending().slice(0, batchSize);
      if (!batch.length) return;
      const result = await send(batch);
      if (result === "retry") return;
      // "drop" também avança: um lote que o servidor recusa não pode travar os próximos.
      store.markSynced(batch[batch.length - 1].id);
    }
  }

  function flush(): Promise<void> {
    if (!running) running = run().finally(() => (running = null));
    return running;
  }

  function start() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (ms: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), ms);
    };
    const off = store.subscribe(() => schedule(delayMs));
    schedule(0); // resto de uma sessão anterior
    return () => {
      off();
      clearTimeout(timer);
    };
  }

  return { flush, start };
}

/** Lê o payload de um JWT, sem validar assinatura (quem valida é o servidor). */
export function jwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Lê o id do usuário de um JWT, sem validar assinatura (quem valida é o servidor). */
export function userIdFromToken(token: string | null): string | null {
  const id = jwtPayload(token)?.userId;
  return typeof id === "string" && id ? id : null;
}
