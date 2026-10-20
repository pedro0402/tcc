import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config";
import { eventSchema, eventsBodySchema } from "./events";
import { rateLimit, type RateLimitOptions } from "./rateLimit";

const prisma = new PrismaClient();

type TokenType = "access" | "refresh";
type JwtPayload = { userId: string; email: string; typ: TokenType };
type AuthedRequest = express.Request & { user: JwtPayload };

// Em segundos: 15 minutos e 7 dias.
const TOKEN_TTL: Record<TokenType, number> = { access: 15 * 60, refresh: 7 * 24 * 60 * 60 };

function signToken(user: { id: string; email: string }, typ: TokenType) {
  return jwt.sign(
    { userId: user.id, email: user.email, typ } satisfies JwtPayload,
    config.jwtSecret,
    { expiresIn: TOKEN_TTL[typ] }
  );
}

/** Valida assinatura, validade e o tipo do token. Tokens sem `typ` são recusados. */
function verifyToken(token: string, typ: TokenType): JwtPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as Partial<JwtPayload>;
    if (payload.typ !== typ || typeof payload.userId !== "string") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
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
  // Só access token autentica: um refresh token não vale como Bearer.
  const payload = verifyToken(header.slice(7), "access");
  if (!payload) return res.status(401).json({ error: "invalid_token" });
  (req as AuthedRequest).user = payload;
  next();
}

/** Express 4 não captura promises rejeitadas: encaminha o erro para o middleware final. */
function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>
): express.RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export interface AppOptions {
  limits?: {
    login?: RateLimitOptions;
    loginPerIp?: RateLimitOptions;
    register?: RateLimitOptions;
    refresh?: RateLimitOptions;
  };
}

// Limites pensados para uso em sala: muitos alunos podem sair pelo mesmo IP,
// então o teto por IP é folgado e o aperto fica na combinação IP + email.
const DEFAULT_LIMITS = {
  login: { windowMs: 15 * 60_000, max: 10 },
  loginPerIp: { windowMs: 15 * 60_000, max: 200 },
  register: { windowMs: 15 * 60_000, max: 50 },
  refresh: { windowMs: 60_000, max: 60 },
} satisfies Required<NonNullable<AppOptions["limits"]>>;

const ipOf = (req: express.Request) => req.ip ?? "unknown";
const bodyEmail = (req: express.Request) => {
  const raw = (req.body as { email?: unknown } | undefined)?.email;
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
};

export function createApp(options: AppOptions = {}) {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const app = express();
  if (config.trustProxy > 0) app.set("trust proxy", config.trustProxy);
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.post(
    "/auth/register",
    rateLimit(limits.register, ipOf),
    asyncHandler(async (req, res) => {
      const parsed = z
        .object({
          email: z.string().email(),
          password: z.string().min(6),
        })
        .safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
      const { email, password } = parsed.data;

      const passwordHash = await bcrypt.hash(password, 10);
      try {
        // O índice único resolve a corrida entre dois registros simultâneos.
        const user = await prisma.user.create({ data: { email, passwordHash } });
        return res.status(201).json({ id: user.id, email: user.email });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return res.status(409).json({ error: "email_taken" });
        }
        throw err;
      }
    })
  );

  app.post(
    "/auth/login",
    rateLimit(limits.loginPerIp, ipOf),
    rateLimit(limits.login, (req) => `${ipOf(req)}|${bodyEmail(req)}`),
    asyncHandler(async (req, res) => {
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
        accessToken: signToken(user, "access"),
        refreshToken: signToken(user, "refresh"),
      });
    })
  );

  app.post(
    "/auth/refresh",
    rateLimit(limits.refresh, ipOf),
    asyncHandler(async (req, res) => {
      const parsed = z.object({ refreshToken: z.string() }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_body" });
      // Só refresh token renova: um access token vazado não se perpetua.
      const payload = verifyToken(parsed.data.refreshToken, "refresh");
      if (!payload) return res.status(401).json({ error: "invalid_token" });
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return res.status(401).json({ error: "invalid_token" });
      return res.json({ accessToken: signToken(user, "access") });
    })
  );

  app.post(
    "/progress",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
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
    })
  );

  app.get(
    "/progress",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
      const rows = await prisma.operationProgress.findMany({
        where: { userId: user.userId },
        orderBy: { completedAt: "desc" },
      });
      return res.json(rows);
    })
  );

  app.post(
    "/quiz-attempts",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
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
    })
  );

  app.get(
    "/quiz-attempts/summary",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
      const [total, correct] = await Promise.all([
        prisma.quizAttempt.count({ where: { userId: user.userId } }),
        prisma.quizAttempt.count({ where: { userId: user.userId, isCorrect: true } }),
      ]);
      return res.json({ total, correct });
    })
  );

  // Eventos de aprendizagem em lote. Idempotente: reenviar o mesmo evento não duplica,
  // e o id do cliente só vale dentro da conta de quem enviou.
  app.post(
    "/events",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
      const body = eventsBodySchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "invalid_body" });

      let accepted = 0;
      let rejected = 0;
      for (const raw of body.data.events) {
        const parsed = eventSchema.safeParse(raw);
        if (!parsed.success) {
          rejected++;
          continue;
        }
        const { id, ts, ...rest } = parsed.data;
        await prisma.learningEvent.upsert({
          where: { userId_clientId: { userId: user.userId, clientId: id } },
          create: { userId: user.userId, clientId: id, occurredAt: new Date(ts), ...rest },
          update: {},
        });
        accepted++;
      }
      return res.status(201).json({ accepted, rejected });
    })
  );

  app.get(
    "/events",
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = (req as AuthedRequest).user;
      const rows = await prisma.learningEvent.findMany({
        where: { userId: user.userId },
        orderBy: { occurredAt: "desc" },
        take: 500,
      });
      return res.json(rows);
    })
  );

  // Middleware de erro final: nenhuma exceção derruba o processo nem vaza stack.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      const type = (err as { type?: string } | null)?.type;
      if (type === "entity.parse.failed") return res.status(400).json({ error: "invalid_json" });
      if (type === "entity.too.large") return res.status(413).json({ error: "payload_too_large" });
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Email já usado (corrida no registro).
        if (err.code === "P2002") return res.status(409).json({ error: "conflict" });
        // Chave estrangeira ou registro ausente: o usuário do token não existe mais.
        if (err.code === "P2003" || err.code === "P2025") {
          return res.status(401).json({ error: "invalid_token" });
        }
      }
      console.error(err);
      return res.status(500).json({ error: "internal_error" });
    }
  );

  return app;
}
