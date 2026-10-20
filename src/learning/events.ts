// Log único de eventos de aprendizagem (previsões, quiz, operações...).
// Tudo que o Progresso mostra é derivado daqui, e é daqui que sai o envio ao servidor.
// A lógica é pura (recebe o armazenamento por parâmetro) para poder ser testada em Node.

export type Approach = "ativa" | "pbl" | "jogo" | "gamificacao" | "pjbl" | "colaborativa";
export type NapsLevel = "viewing" | "responding" | "changing" | "constructing" | "presenting";
export type EventKind =
  | "prediction"
  | "quiz"
  | "operation"
  | "problem"
  | "game-level"
  | "milestone"
  | "self-explanation"
  | "share";
export type EventStructure = "stack" | "linkedList";
export type EventVariant = "simples" | "dupla" | "circular";

export interface LearningEvent {
  /** Gerado no cliente; o servidor usa para não duplicar. */
  id: string;
  /** ISO 8601 em UTC. */
  ts: string;
  approach: Approach;
  naps?: NapsLevel;
  kind: EventKind;
  activityId: string;
  concept?: string;
  structure?: EventStructure;
  variant?: EventVariant;
  operation?: string;
  correct?: boolean;
  confidence?: 0 | 1 | 2;
  hintsUsed?: number;
  attempts?: number;
  misconception?: string;
  stage?: "observar" | "prever" | "fazer" | "desafio";
  pair?: boolean;
}

export type NewEvent = Omit<LearningEvent, "id" | "ts"> & { id?: string; ts?: string };

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const EVENTS_KEY = "ds-visualizer-learning-v1";
export const MAX_EVENTS = 2000;
const SYNC_KEY = "ds-visualizer-learning-synced-v1";
const OWNER_KEY = "ds-visualizer-learning-owner-v1";
const MIGRATED_KEY = "ds-visualizer-learning-migrated-v1";
const LEGACY_KEY = "ds-visualizer-progress-v1";

export function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

/** localStorage quando existe e funciona; memória caso contrário (SSR, modo privado). */
export function browserStorage(): KeyValueStorage {
  try {
    const ls = globalThis.localStorage;
    const probe = "__ds_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStorage();
  }
}

function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const isEvent = (x: unknown): x is LearningEvent => {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.ts === "string" &&
    typeof e.approach === "string" &&
    typeof e.kind === "string" &&
    typeof e.activityId === "string"
  );
};

export type LegacyProgress = {
  completedOperations?: Array<{ structure: string; operation: string; completedAt: string }>;
  quizAttempts?: Array<{ questionId: string; isCorrect: boolean; answeredAt: string }>;
  predictions?: Array<{ structure: string; operation: string; isCorrect: boolean; answeredAt: string }>;
};

export const asStructure = (s: string): EventStructure | undefined =>
  s === "stack" || s === "linkedList" ? s : undefined;

/** Converte o formato antigo (progress-v1) em eventos, com ids determinísticos. */
export function legacyToEvents(legacy: LegacyProgress): LearningEvent[] {
  const out: LearningEvent[] = [];
  (legacy.completedOperations ?? []).forEach((o, i) => {
    out.push({
      id: `legacy-op-${i}-${o.completedAt}`,
      ts: o.completedAt,
      approach: "ativa",
      naps: "changing",
      kind: "operation",
      activityId: `${o.structure}:${o.operation}`,
      structure: asStructure(o.structure),
      operation: o.operation,
    });
  });
  (legacy.predictions ?? []).forEach((p, i) => {
    out.push({
      id: `legacy-pred-${i}-${p.answeredAt}`,
      ts: p.answeredAt,
      approach: "ativa",
      naps: "responding",
      kind: "prediction",
      activityId: `${p.structure}:${p.operation}`,
      structure: asStructure(p.structure),
      operation: p.operation,
      correct: p.isCorrect,
    });
  });
  (legacy.quizAttempts ?? []).forEach((q, i) => {
    out.push({
      id: `legacy-quiz-${i}-${q.answeredAt}`,
      ts: q.answeredAt,
      approach: "ativa",
      naps: "responding",
      kind: "quiz",
      activityId: q.questionId,
      correct: q.isCorrect,
    });
  });
  return out;
}

export interface EventStore {
  /** Referência estável enquanto nada muda (serve de snapshot para o React). */
  getEvents(): readonly LearningEvent[];
  log(event: NewEvent): LearningEvent;
  subscribe(listener: () => void): () => void;
  /** Descarta o cache e reavisa (ex.: outra aba alterou o armazenamento). */
  invalidate(): void;
  /** Eventos ainda não enviados ao servidor. */
  pending(): LearningEvent[];
  markSynced(lastId: string): void;
  /**
   * Liga o cursor de envio a uma conta. Se a conta for outra (ou a primeira), o histórico
   * que já existe neste navegador NÃO é enviado: só o que vier depois. Evita que, num
   * computador compartilhado, o histórico de uma pessoa suba para a conta de outra.
   */
  bindSyncOwner(userId: string): void;
  /** Conta a que o cursor de envio está ligado (null = nunca ligado). */
  getSyncOwner(): string | null;
  /** Importa o progresso do formato antigo, uma única vez. Devolve quantos eventos entraram. */
  migrateLegacy(): number;
  clear(): void;
}

export function createEventStore(
  storage: KeyValueStorage,
  deps: { now?: () => Date; newId?: () => string } = {},
): EventStore {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomId;
  let cache: readonly LearningEvent[] | null = null;
  // Cursor também em memória: se a gravação falhar, o envio não repete o mesmo lote para sempre.
  let cursor: string | null | undefined;
  const getCursor = () => (cursor !== undefined ? cursor : (cursor = storage.getItem(SYNC_KEY)));
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  function read(): readonly LearningEvent[] {
    if (cache) return cache;
    let events: LearningEvent[] = [];
    try {
      const raw = storage.getItem(EVENTS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) events = parsed.filter(isEvent);
    } catch {
      events = [];
    }
    cache = events;
    return cache;
  }

  function write(events: LearningEvent[]): void {
    const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
    cache = trimmed;
    try {
      storage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
    } catch {
      // Sem espaço ou bloqueado: o cache em memória segue valendo nesta sessão.
    }
    notify();
  }

  return {
    getEvents: read,

    log(event) {
      const full: LearningEvent = { ...event, id: event.id ?? newId(), ts: event.ts ?? now().toISOString() };
      write([...read(), full]);
      return full;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },

    invalidate() {
      cache = null;
      notify();
    },

    pending() {
      const events = read();
      const last = getCursor();
      if (!last) return [...events];
      const at = events.findIndex((e) => e.id === last);
      // Cursor não encontrado (já saiu do teto de eventos): tudo o que resta é novo.
      return at < 0 ? [...events] : events.slice(at + 1);
    },

    markSynced(lastId) {
      cursor = lastId;
      try {
        storage.setItem(SYNC_KEY, lastId);
      } catch {
        // Na pior hipótese reenviamos; o servidor ignora duplicados.
      }
    },

    getSyncOwner() {
      try {
        return storage.getItem(OWNER_KEY);
      } catch {
        return null;
      }
    },

    bindSyncOwner(userId) {
      if (storage.getItem(OWNER_KEY) === userId) return;
      const events = read();
      const last = events.length ? events[events.length - 1].id : null;
      cursor = last;
      try {
        storage.setItem(OWNER_KEY, userId);
        if (last) storage.setItem(SYNC_KEY, last);
        else storage.removeItem(SYNC_KEY);
      } catch {
        // Sem gravar, vale o cursor em memória nesta sessão.
      }
    },

    migrateLegacy() {
      if (storage.getItem(MIGRATED_KEY)) return 0;
      let added = 0;
      try {
        const raw = storage.getItem(LEGACY_KEY);
        if (raw) {
          const legacy = JSON.parse(raw) as LegacyProgress;
          const known = new Set(read().map((e) => e.id));
          const fresh = legacyToEvents(legacy).filter((e) => !known.has(e.id));
          if (fresh.length) {
            write([...read(), ...fresh].sort((a, b) => a.ts.localeCompare(b.ts)));
            added = fresh.length;
          }
        }
      } catch {
        // Dado antigo ilegível: segue sem migrar.
      }
      try {
        // O formato antigo fica guardado; só marcamos que já foi importado.
        storage.setItem(MIGRATED_KEY, "1");
      } catch {
        // Se não gravar, a deduplicação por id evita eventos repetidos na próxima vez.
      }
      return added;
    },

    clear() {
      cache = [];
      cursor = null;
      try {
        storage.removeItem(EVENTS_KEY);
        storage.removeItem(SYNC_KEY);
      } catch {
        // ignora
      }
      notify();
    },
  };
}

/** Armazém usado pelo app. Criado sob demanda para não tocar o navegador na importação. */
let singleton: EventStore | null = null;
export function eventStore(): EventStore {
  if (!singleton) singleton = createEventStore(browserStorage());
  return singleton;
}

export const logEvent = (e: NewEvent) => eventStore().log(e);
export const getEvents = () => eventStore().getEvents();
export const subscribeEvents = (l: () => void) => eventStore().subscribe(l);
