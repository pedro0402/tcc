import { browserStorage, type KeyValueStorage } from "../learning/events";
import { jwtPayload } from "../learning/sync";

// Sem VITE_API_URL: em desenvolvimento usa a API local; no build de produção usa
// a mesma origem do site (API atrás do mesmo domínio/proxy), nunca o localhost do aluno.
const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

export const ACCESS_KEY = "ds-visualizer-token";
export const REFRESH_KEY = "ds-visualizer-refresh-token";

/** Motivo da última mudança de sessão, para a UI explicar o que aconteceu. */
export type SessionChange = "login" | "logout" | "expired";

export interface AuthClient {
  getToken(): string | null;
  /** Há sessão que ainda pode autenticar (access válido ou refresh válido). */
  isLoggedIn(): boolean;
  login(email: string, password: string): Promise<boolean>;
  register(email: string, password: string): Promise<boolean>;
  logout(): void;
  /**
   * fetch com Bearer. Num 401 tenta renovar o access token uma vez e repete.
   * Se a renovação falhar, encerra a sessão e avisa os inscritos ("expired").
   * Devolve null sem sessão ou sem rede.
   */
  authedFetch(path: string, init: RequestInit): Promise<Response | null>;
  subscribe(listener: (change: SessionChange) => void): () => void;
}

/** Segundos até expirar; null se o token não tem `exp` legível. */
function secondsLeft(token: string | null, nowMs: number): number | null {
  const exp = jwtPayload(token)?.exp;
  return typeof exp === "number" ? exp - nowMs / 1000 : null;
}

export function createAuthClient(deps: {
  base: string;
  storage: KeyValueStorage;
  fetchFn?: typeof fetch;
  now?: () => number;
}): AuthClient {
  const { base, storage } = deps;
  const fetchFn = deps.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const now = deps.now ?? Date.now;
  const listeners = new Set<(change: SessionChange) => void>();
  const emit = (c: SessionChange) => listeners.forEach((l) => l(c));

  const get = (k: string) => {
    try {
      return storage.getItem(k);
    } catch {
      return null;
    }
  };
  const set = (k: string, v: string | null) => {
    try {
      if (v === null) storage.removeItem(k);
      else storage.setItem(k, v);
    } catch {
      // Armazenamento bloqueado: a sessão não persiste, mas o app segue.
    }
  };
  const clear = () => {
    set(ACCESS_KEY, null);
    set(REFRESH_KEY, null);
  };
  const valid = (token: string | null) => {
    if (!token) return false;
    const left = secondsLeft(token, now());
    // Sem exp legível, deixa o servidor decidir.
    return left === null || left > 0;
  };

  // Uma renovação por vez: vários 401 simultâneos esperam a mesma promessa.
  let refreshing: Promise<string | null> | null = null;
  async function refresh(): Promise<string | null> {
    const refreshToken = get(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const res = await fetchFn(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.status === 401 || res.status === 400) {
        clear();
        emit("expired");
        return null;
      }
      if (!res.ok) return null; // erro temporário: mantém a sessão
      const data = (await res.json()) as { accessToken?: unknown };
      if (typeof data.accessToken !== "string") return null;
      set(ACCESS_KEY, data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }
  const refreshOnce = () => (refreshing ??= refresh().finally(() => (refreshing = null)));

  const send = (path: string, init: RequestInit, token: string) =>
    fetchFn(`${base}${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
    });

  return {
    getToken: () => get(ACCESS_KEY),

    isLoggedIn: () => valid(get(ACCESS_KEY)) || valid(get(REFRESH_KEY)),

    async login(email, password) {
      try {
        const res = await fetchFn(`${base}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken?: unknown; refreshToken?: unknown };
        if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") return false;
        set(ACCESS_KEY, data.accessToken);
        set(REFRESH_KEY, data.refreshToken);
        emit("login");
        return true;
      } catch {
        return false;
      }
    },

    async register(email, password) {
      try {
        const res = await fetchFn(`${base}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    logout() {
      clear();
      emit("logout");
    },

    async authedFetch(path, init) {
      let token = get(ACCESS_KEY);
      // Access vencido mas refresh disponível: renova antes de mandar.
      if (!valid(token) && get(REFRESH_KEY)) token = await refreshOnce();
      if (!token) return null;
      try {
        let res = await send(path, init, token);
        if (res.status === 401) {
          const fresh = await refreshOnce();
          if (!fresh) return res;
          res = await send(path, init, fresh);
        }
        return res;
      } catch {
        return null;
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

let singleton: AuthClient | null = null;
/** Cliente usado pelo app. Criado sob demanda para não tocar o navegador na importação. */
export function auth(): AuthClient {
  if (!singleton) singleton = createAuthClient({ base: API_BASE, storage: browserStorage() });
  return singleton;
}

export const getToken = () => auth().getToken();
export const login = (email: string, password: string) => auth().login(email, password);
export const register = (email: string, password: string) => auth().register(email, password);

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function postAuthed(path: string, body: unknown): Promise<boolean> {
  const res = await auth().authedFetch(path, json(body));
  return !!res?.ok;
}

/** Interpreta a resposta do envio de eventos. Exportada para teste. */
export function eventsResult(res: Response | null): "ok" | "retry" | "drop" {
  if (!res) return "retry"; // sem sessão ou sem rede
  if (res.ok) return "ok";
  if (res.status === 400 || res.status === 413 || res.status === 422) return "drop";
  return "retry"; // 401 (sessão vencida) ou erro do servidor
}

/**
 * Envia um lote de eventos de aprendizagem.
 * ok = aceito; drop = o servidor recusou o formato (não adianta repetir);
 * retry = sem login, sem rede, sessão vencida ou erro do servidor.
 */
export async function postEvents(events: unknown[]): Promise<"ok" | "retry" | "drop"> {
  return eventsResult(await auth().authedFetch("/events", json({ events })));
}

export async function syncProgressToApi(structure: string, operation: string): Promise<void> {
  await postAuthed("/progress", { structure, operation });
}

export async function syncQuizToApi(questionId: string, isCorrect: boolean): Promise<void> {
  await postAuthed("/quiz-attempts", { questionId, isCorrect });
}
