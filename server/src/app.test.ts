import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./createApp";

const app = createApp();

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
