import { describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../learning/events";
import { ACCESS_KEY, REFRESH_KEY, createAuthClient, eventsResult, type SessionChange } from "./progressClient";

/** JWT só com payload (assinatura irrelevante: quem valida é o servidor). */
const jwt = (payload: Record<string, unknown>) =>
  `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;
const NOW = 1_700_000_000_000;
const future = NOW / 1000 + 600;
const past = NOW / 1000 - 10;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function setup(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const storage = memoryStorage();
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => handler(url, init));
  const client = createAuthClient({ base: "http://api", storage, fetchFn: fetchFn as unknown as typeof fetch, now: () => NOW });
  const changes: SessionChange[] = [];
  client.subscribe((c) => changes.push(c));
  return { storage, fetchFn, client, changes };
}

describe("login", () => {
  it("guarda access e refresh token", async () => {
    const access = jwt({ userId: "u", exp: future });
    const { client, storage, changes } = setup(() => json(200, { accessToken: access, refreshToken: "r" }));
    expect(await client.login("a@b.co", "secret12")).toBe(true);
    expect(storage.getItem(ACCESS_KEY)).toBe(access);
    expect(storage.getItem(REFRESH_KEY)).toBe("r");
    expect(changes).toEqual(["login"]);
  });

  it("resposta sem tokens não conta como login", async () => {
    const { client, storage } = setup(() => json(200, {}));
    expect(await client.login("a@b.co", "secret12")).toBe(false);
    expect(storage.getItem(ACCESS_KEY)).toBeNull();
  });
});

describe("authedFetch", () => {
  it("renova o access token num 401 e repete o pedido", async () => {
    const fresh = jwt({ userId: "u", exp: future, fresh: true });
    const { client, storage, fetchFn } = setup((url, init) => {
      if (url.endsWith("/auth/refresh")) return json(200, { accessToken: fresh });
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === `Bearer ${fresh}` ? json(201, {}) : json(401, {});
    });
    storage.setItem(ACCESS_KEY, jwt({ userId: "u", exp: future }));
    storage.setItem(REFRESH_KEY, "r");
    const res = await client.authedFetch("/events", { method: "POST" });
    expect(res?.status).toBe(201);
    expect(storage.getItem(ACCESS_KEY)).toBe(fresh);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("access já vencido é renovado antes do envio", async () => {
    const fresh = jwt({ userId: "u", exp: future, fresh: true });
    const { client, storage, fetchFn } = setup((url) =>
      url.endsWith("/auth/refresh") ? json(200, { accessToken: fresh }) : json(200, {}),
    );
    storage.setItem(ACCESS_KEY, jwt({ userId: "u", exp: past }));
    storage.setItem(REFRESH_KEY, "r");
    await client.authedFetch("/progress", { method: "POST" });
    expect(fetchFn.mock.calls.map((c) => c[0])).toEqual(["http://api/auth/refresh", "http://api/progress"]);
  });

  it("refresh recusado encerra a sessão e avisa", async () => {
    const { client, storage, changes } = setup((url) => (url.endsWith("/auth/refresh") ? json(401, {}) : json(401, {})));
    storage.setItem(ACCESS_KEY, jwt({ userId: "u", exp: future }));
    storage.setItem(REFRESH_KEY, "r");
    const res = await client.authedFetch("/events", { method: "POST" });
    expect(res?.status).toBe(401);
    expect(client.isLoggedIn()).toBe(false);
    expect(storage.getItem(REFRESH_KEY)).toBeNull();
    expect(changes).toEqual(["expired"]);
  });

  it("vários 401 simultâneos fazem uma única renovação", async () => {
    const fresh = jwt({ userId: "u", exp: future, fresh: true });
    let refreshes = 0;
    const { client, storage } = setup((url, init) => {
      if (url.endsWith("/auth/refresh")) {
        refreshes++;
        return json(200, { accessToken: fresh });
      }
      return (init.headers as Record<string, string>).Authorization === `Bearer ${fresh}` ? json(200, {}) : json(401, {});
    });
    storage.setItem(ACCESS_KEY, jwt({ userId: "u", exp: future }));
    storage.setItem(REFRESH_KEY, "r");
    await Promise.all([1, 2, 3].map(() => client.authedFetch("/events", { method: "POST" })));
    expect(refreshes).toBe(1);
  });

  it("sem sessão devolve null sem chamar a rede", async () => {
    const { client, fetchFn } = setup(() => json(200, {}));
    expect(await client.authedFetch("/events", { method: "POST" })).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("isLoggedIn e logout", () => {
  it("considera o refresh válido mesmo com access vencido", () => {
    const { client, storage } = setup(() => json(200, {}));
    storage.setItem(ACCESS_KEY, jwt({ exp: past }));
    expect(client.isLoggedIn()).toBe(false);
    storage.setItem(REFRESH_KEY, jwt({ exp: future }));
    expect(client.isLoggedIn()).toBe(true);
  });

  it("logout limpa os dois tokens", () => {
    const { client, storage, changes } = setup(() => json(200, {}));
    storage.setItem(ACCESS_KEY, "a");
    storage.setItem(REFRESH_KEY, "r");
    client.logout();
    expect(storage.getItem(ACCESS_KEY)).toBeNull();
    expect(storage.getItem(REFRESH_KEY)).toBeNull();
    expect(changes).toEqual(["logout"]);
  });
});

describe("eventsResult", () => {
  it("422 (lote todo rejeitado) é descartado, 401 e 500 tentam de novo", () => {
    expect(eventsResult(new Response(null, { status: 201 }))).toBe("ok");
    expect(eventsResult(new Response(null, { status: 422 }))).toBe("drop");
    expect(eventsResult(new Response(null, { status: 401 }))).toBe("retry");
    expect(eventsResult(new Response(null, { status: 500 }))).toBe("retry");
    expect(eventsResult(null)).toBe("retry");
  });
});
