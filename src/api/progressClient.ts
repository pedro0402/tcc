const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function getToken(): string | null {
  try {
    return localStorage.getItem("ds-visualizer-token");
  } catch {
    return null;
  }
}

async function postAuthed(path: string, body: unknown): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Envia um lote de eventos de aprendizagem.
 * ok = aceito; drop = o servidor recusou o formato (não adianta repetir);
 * retry = sem login, sem rede, sessão vencida ou erro do servidor.
 */
export async function postEvents(
  events: unknown[]
): Promise<"ok" | "retry" | "drop"> {
  const token = getToken();
  if (!token) return "retry";
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
    });
    if (res.ok) return "ok";
    if (res.status === 400 || res.status === 413 || res.status === 422) return "drop";
    return "retry";
  } catch {
    return "retry";
  }
}

export async function syncProgressToApi(
  structure: string,
  operation: string
): Promise<void> {
  await postAuthed("/progress", { structure, operation });
}

export async function syncQuizToApi(
  questionId: string,
  isCorrect: boolean
): Promise<void> {
  await postAuthed("/quiz-attempts", { questionId, isCorrect });
}

export async function login(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    localStorage.setItem("ds-visualizer-token", data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function register(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
