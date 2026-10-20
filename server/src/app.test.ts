import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./createApp";

const app = createApp();
const db = new PrismaClient();
afterAll(() => db.$disconnect());

const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
async function registerAndLogin(email: string, password = "secret12") {
  await request(app).post("/auth/register").send({ email, password });
  const login = await request(app).post("/auth/login").send({ email, password });
  return login.body as { accessToken: string; refreshToken: string };
}

describe("robustez do servidor", () => {
  it("registros simultâneos do mesmo email não derrubam o processo", async () => {
    const email = `race-${uniq()}@example.com`;
    const results = await Promise.all(
      [0, 1, 2].map(() => request(app).post("/auth/register").send({ email, password: "secret12" }))
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409]);
  });

  it("token de usuário apagado recebe 401, não trava a requisição", async () => {
    const email = `gone-${uniq()}@example.com`;
    const { accessToken } = await registerAndLogin(email);
    await db.user.delete({ where: { email } });
    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ structure: "stack", operation: "push" });
    expect(res.status).toBe(401);
  });

  it("JSON malformado devolve 400 em JSON", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{ruim");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "invalid_json" });
  });
});

describe("auth and progress API", () => {
  const email = `user-${Date.now()}@example.com`;
  const password = "secret12";
  let token = "";

  beforeAll(async () => {
    await request(app).post("/auth/register").send({ email, password });
    const login = await request(app)
      .post("/auth/login")
      .send({ email, password });
    token = login.body.accessToken;
  });

  it("registers and logs in", () => {
    expect(token).toBeTruthy();
  });

  it("records progress when authenticated", async () => {
    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${token}`)
      .send({ structure: "stack", operation: "push" });
    expect(res.status).toBe(201);
  });

  it("records quiz attempts", async () => {
    const res = await request(app)
      .post("/quiz-attempts")
      .set("Authorization", `Bearer ${token}`)
      .send({ questionId: "stack-lifo", isCorrect: true });
    expect(res.status).toBe(201);

    const summary = await request(app)
      .get("/quiz-attempts/summary")
      .set("Authorization", `Bearer ${token}`);
    expect(summary.body.total).toBeGreaterThan(0);
  });
});

describe("learning events API", () => {
  const stamp = Date.now();
  const password = "secret12";
  let tokenA = "";
  let tokenB = "";

  const ev = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    ts: new Date().toISOString(),
    approach: "ativa",
    kind: "prediction",
    activityId: "stack:push",
    structure: "stack",
    operation: "push",
    correct: true,
    ...extra,
  });
  const post = (token: string, body: unknown) =>
    request(app).post("/events").set("Authorization", `Bearer ${token}`).send(body as object);
  const list = (token: string) => request(app).get("/events").set("Authorization", `Bearer ${token}`);

  beforeAll(async () => {
    const make = async (tag: string) => {
      const email = `ev-${tag}-${stamp}@example.com`;
      await request(app).post("/auth/register").send({ email, password });
      const login = await request(app).post("/auth/login").send({ email, password });
      return login.body.accessToken as string;
    };
    tokenA = await make("a");
    tokenB = await make("b");
  });

  it("exige autenticação", async () => {
    const res = await request(app).post("/events").send({ events: [ev("x")] });
    expect(res.status).toBe(401);
  });

  it("grava um lote válido", async () => {
    const res = await post(tokenA, { events: [ev("a-1"), ev("a-2", { correct: false, variant: "dupla" })] });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ accepted: 2, rejected: 0 });
    const rows = (await list(tokenA)).body as Array<{ clientId: string }>;
    expect(rows.map((r) => r.clientId).sort()).toEqual(["a-1", "a-2"]);
  });

  it("é idempotente: reenviar não duplica", async () => {
    await post(tokenA, { events: [ev("a-1"), ev("a-2")] });
    const rows = (await list(tokenA)).body as Array<{ clientId: string }>;
    expect(rows.filter((r) => r.clientId === "a-1")).toHaveLength(1);
    expect(rows).toHaveLength(2);
  });

  it("um evento inválido não derruba o lote", async () => {
    const res = await post(tokenA, {
      events: [ev("a-3"), ev("a-bad", { approach: "inexistente" }), ev("a-extra", { campoNovo: 1 }), "lixo"],
    });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ accepted: 1, rejected: 3 });
  });

  it("rejeita corpo fora do formato e lotes grandes demais", async () => {
    expect((await post(tokenA, { events: [] })).status).toBe(400);
    expect((await post(tokenA, { eventos: [ev("z")] })).status).toBe(400);
    const big = Array.from({ length: 101 }, (_, i) => ev(`big-${i}`));
    expect((await post(tokenA, { events: big })).status).toBe(400);
  });

  it("o id do cliente só vale dentro da própria conta", async () => {
    // B envia um evento com o mesmo id de A, mas com conteúdo diferente.
    const res = await post(tokenB, { events: [ev("a-1", { correct: false, operation: "pop" })] });
    expect(res.body).toEqual({ accepted: 1, rejected: 0 });

    const a = (await list(tokenA)).body as Array<{ clientId: string; correct: boolean; operation: string }>;
    const aOne = a.find((r) => r.clientId === "a-1")!;
    expect(aOne.correct).toBe(true); // o de A não foi sobrescrito
    expect(aOne.operation).toBe("push");

    const b = (await list(tokenB)).body as Array<{ clientId: string }>;
    expect(b.map((r) => r.clientId)).toEqual(["a-1"]); // B só enxerga o dele
  });
});
