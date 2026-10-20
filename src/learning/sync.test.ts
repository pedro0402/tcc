import { afterEach, describe, expect, it, vi } from "vitest";
import { createEventStore, memoryStorage, type NewEvent } from "./events";
import {
  ANON_OWNER,
  bindExistingSession,
  createEventSync,
  releaseSyncOwner,
  userIdFromToken,
  type SendResult,
} from "./sync";

const tokenFor = (userId: string) => `x.${btoa(JSON.stringify({ userId })).replace(/=+$/, "")}.y`;

describe("dono do cursor ao entrar e sair", () => {
  it("token antigo sem dono gravado não envia o histórico anterior", () => {
    const store = createEventStore(memoryStorage());
    store.log({ approach: "ativa", kind: "quiz", activityId: "q" });
    bindExistingSession(store, tokenFor("A"));
    expect(store.getSyncOwner()).toBe("A");
    expect(store.pending()).toEqual([]);
  });

  it("com dono já gravado, não mexe no cursor", () => {
    const store = createEventStore(memoryStorage());
    store.bindSyncOwner("A");
    const e = store.log({ approach: "ativa", kind: "quiz", activityId: "q" });
    bindExistingSession(store, tokenFor("A"));
    expect(store.pending().map((x) => x.id)).toEqual([e.id]);
  });

  it("A sai, outra pessoa usa anônima, A entra de novo: nada da outra pessoa sobe", () => {
    const store = createEventStore(memoryStorage());
    store.bindSyncOwner("A");
    releaseSyncOwner(store);
    expect(store.getSyncOwner()).toBe(ANON_OWNER);
    store.log({ approach: "ativa", kind: "quiz", activityId: "de-B" });
    store.bindSyncOwner("A");
    expect(store.pending()).toEqual([]);
  });
});

const ev: NewEvent = { approach: "ativa", kind: "quiz", activityId: "q1", correct: true };

function setup(results: SendResult[] | ((n: number) => SendResult) = () => "ok", opts: { batchSize?: number; delayMs?: number } = {}) {
  let n = 0;
  const store = createEventStore(memoryStorage(), { newId: () => `e${++n}` });
  const calls: string[][] = [];
  let call = 0;
  const send = vi.fn(async (events: { id: string }[]) => {
    calls.push(events.map((e) => e.id));
    const r = typeof results === "function" ? results(call) : results[Math.min(call, results.length - 1)];
    call++;
    return r;
  });
  const sync = createEventSync({ store, send, ...opts });
  return { store, send, calls, sync };
}

afterEach(() => vi.useRealTimers());

describe("flush", () => {
  it("envia o pendente e avança o cursor", async () => {
    const { store, sync, calls } = setup();
    store.log(ev);
    store.log(ev);
    await sync.flush();
    expect(calls).toEqual([["e1", "e2"]]);
    expect(store.pending()).toEqual([]);
  });

  it("divide em lotes", async () => {
    const { store, sync, calls } = setup(() => "ok", { batchSize: 2 });
    for (let i = 0; i < 5; i++) store.log(ev);
    await sync.flush();
    expect(calls).toEqual([["e1", "e2"], ["e3", "e4"], ["e5"]]);
  });

  it("retry: mantém tudo pendente e para", async () => {
    const { store, sync, send } = setup(["retry"]);
    store.log(ev);
    await sync.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(store.pending()).toHaveLength(1);
  });

  it("drop: descarta o lote recusado e segue para os próximos", async () => {
    const { store, sync, calls } = setup((n) => (n === 0 ? "drop" : "ok"), { batchSize: 1 });
    store.log(ev);
    store.log(ev);
    await sync.flush();
    expect(calls).toEqual([["e1"], ["e2"]]);
    expect(store.pending()).toEqual([]);
  });

  it("não fica em laço infinito se o cursor não puder ser gravado", async () => {
    const storage = memoryStorage();
    let n = 0;
    const store = createEventStore(storage, { newId: () => `e${++n}` });
    store.log(ev);
    storage.setItem = () => {
      throw new Error("bloqueado");
    };
    const send = vi.fn(async () => "ok" as SendResult);
    await createEventSync({ store, send }).flush();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("chamadas simultâneas viram um único envio", async () => {
    const { store, sync, send } = setup();
    store.log(ev);
    await Promise.all([sync.flush(), sync.flush(), sync.flush()]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("sem pendência, não chama o servidor", async () => {
    const { sync, send } = setup();
    await sync.flush();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("start (envio automático)", () => {
  it("agrupa vários eventos num só envio depois do atraso", async () => {
    vi.useFakeTimers();
    const { store, sync, calls } = setup(() => "ok", { delayMs: 1000 });
    const stop = sync.start();
    await vi.advanceTimersByTimeAsync(10); // envio inicial: nada pendente
    store.log(ev);
    store.log(ev);
    store.log(ev);
    await vi.advanceTimersByTimeAsync(999);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2);
    expect(calls).toEqual([["e1", "e2", "e3"]]);
    stop();
  });

  it("depois de parar, não envia mais", async () => {
    vi.useFakeTimers();
    const { store, sync, send } = setup(() => "ok", { delayMs: 100 });
    const stop = sync.start();
    stop();
    store.log(ev);
    await vi.advanceTimersByTimeAsync(1000);
    expect(send).not.toHaveBeenCalled();
  });

  it("ao iniciar, envia o que sobrou de uma sessão anterior", async () => {
    vi.useFakeTimers();
    const { store, sync, calls } = setup();
    store.log(ev);
    sync.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(calls).toEqual([["e1"]]);
  });
});

describe("conta dona do cursor", () => {
  it("primeira conta: o histórico anônimo existente não sobe", () => {
    const { store } = setup();
    store.log(ev);
    store.log(ev);
    store.bindSyncOwner("ana");
    expect(store.pending()).toEqual([]);
    store.log(ev);
    expect(store.pending().map((e) => e.id)).toEqual(["e3"]);
  });

  it("mesma conta voltando: retoma de onde parou, sem perder o que ficou pendente", () => {
    const { store } = setup();
    store.bindSyncOwner("ana");
    store.log(ev);
    store.log(ev); // ficou pendente (ex.: token expirou)
    store.bindSyncOwner("ana");
    expect(store.pending().map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("outra conta no mesmo navegador: não herda o histórico da anterior", () => {
    const { store } = setup();
    store.bindSyncOwner("ana");
    store.log(ev);
    store.log(ev); // pendentes da Ana
    store.bindSyncOwner("bia");
    expect(store.pending()).toEqual([]);
    store.log(ev);
    expect(store.pending().map((e) => e.id)).toEqual(["e3"]);
  });

  it("sem eventos, a troca de conta limpa o cursor", () => {
    const { store } = setup();
    store.bindSyncOwner("ana");
    store.bindSyncOwner("bia");
    store.log(ev);
    expect(store.pending()).toHaveLength(1);
  });
});

describe("userIdFromToken", () => {
  const b64url = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = (payload: object) => `${b64url({ alg: "HS256" })}.${b64url(payload)}.assinatura`;

  it("lê o userId do payload", () => {
    expect(userIdFromToken(jwt({ userId: "u-123", email: "a@b.c" }))).toBe("u-123");
  });

  it("aceita payload com caracteres não ASCII em base64url", () => {
    expect(userIdFromToken(jwt({ userId: "u-???>>", email: "a@b.c" }))).toBe("u-???>>");
  });

  it("devolve null para token ausente, mal formado ou sem userId", () => {
    expect(userIdFromToken(null)).toBeNull();
    expect(userIdFromToken("")).toBeNull();
    expect(userIdFromToken("so-uma-parte")).toBeNull();
    expect(userIdFromToken("a.%%%.c")).toBeNull();
    expect(userIdFromToken(jwt({ email: "x" }))).toBeNull();
    expect(userIdFromToken(jwt({ userId: 5 }))).toBeNull();
  });
});
