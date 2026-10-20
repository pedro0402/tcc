import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Carrega server/.env explicitamente. Antes, as variáveis só chegavam ao
// process.env porque o PrismaClient lia o .env como efeito colateral.
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const NODE_ENV = process.env.NODE_ENV ?? "development";
const MIN_SECRET_BYTES = 32;

/**
 * Segredo do JWT. Sem fallback fixo: quem não configura não sobe o servidor.
 * Em teste, sem segredo definido, usa um aleatório por processo.
 * Segredo curto é erro em produção e aviso em desenvolvimento.
 */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (NODE_ENV === "test") return randomBytes(32).toString("hex");
    throw new Error("JWT_SECRET não definido. Copie server/.env.example para server/.env e gere um segredo (openssl rand -hex 32).");
  }
  if (Buffer.byteLength(secret) < MIN_SECRET_BYTES) {
    const msg = `JWT_SECRET tem menos de ${MIN_SECRET_BYTES} bytes.`;
    if (NODE_ENV === "production") throw new Error(msg);
    if (NODE_ENV !== "test") console.warn(`[aviso] ${msg} Use um segredo mais longo fora do ambiente local.`);
  }
  return secret;
}

export const config = {
  nodeEnv: NODE_ENV,
  jwtSecret: resolveJwtSecret(),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  port: Number(process.env.PORT ?? 3001),
  // Número de proxies na frente do servidor (para req.ip correto no rate limit).
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};
