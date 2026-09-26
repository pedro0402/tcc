import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

type JwtPayload = { userId: string; email: string };

function signAccess(user: { id: string; email: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function signRefresh(user: { id: string; email: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
    (req as express.Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function createApp() {
  const app = express();
  app.use(cors({ origin: CORS_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.post("/auth/register", async (req, res) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) return res.status(409).json({ error: "email_taken" });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: { email: parsed.data.email, passwordHash },
    });
    return res.status(201).json({ id: user.id, email: user.email });
  });

  app.post("/auth/login", async (req, res) => {
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user) return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    return res.json({
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
    });
  });

  app.post("/auth/refresh", async (req, res) => {
    const parsed = z.object({ refreshToken: z.string() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
    try {
      const payload = jwt.verify(
        parsed.data.refreshToken,
        JWT_SECRET
      ) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) return res.status(401).json({ error: "invalid_token" });
      return res.json({ accessToken: signAccess(user) });
    } catch {
      return res.status(401).json({ error: "invalid_token" });
    }
  });

  app.post("/progress", requireAuth, async (req, res) => {
    const user = (req as express.Request & { user: JwtPayload }).user;
    const parsed = z
      .object({ structure: z.string(), operation: z.string() })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

    const row = await prisma.operationProgress.create({
      data: {
        userId: user.userId,
        structure: parsed.data.structure,
        operation: parsed.data.operation,
      },
    });
    return res.status(201).json(row);
  });

  app.get("/progress", requireAuth, async (req, res) => {
    const user = (req as express.Request & { user: JwtPayload }).user;
    const rows = await prisma.operationProgress.findMany({
      where: { userId: user.userId },
      orderBy: { completedAt: "desc" },
    });
    return res.json(rows);
  });

  app.post("/quiz-attempts", requireAuth, async (req, res) => {
    const user = (req as express.Request & { user: JwtPayload }).user;
    const parsed = z
      .object({ questionId: z.string(), isCorrect: z.boolean() })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

    const row = await prisma.quizAttempt.create({
      data: {
        userId: user.userId,
        questionId: parsed.data.questionId,
        isCorrect: parsed.data.isCorrect,
      },
    });
    return res.status(201).json(row);
  });

  app.get("/quiz-attempts/summary", requireAuth, async (req, res) => {
    const user = (req as express.Request & { user: JwtPayload }).user;
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: user.userId },
    });
    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    return res.json({ total, correct });
  });

  return app;
}
