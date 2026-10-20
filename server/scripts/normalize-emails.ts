/**
 * Normaliza os emails já gravados (trim + minúsculas), que antes eram
 * diferenciados por caixa. Uso: npm run db:normalize-emails [-- --apply]
 *
 * Sem --apply só lista o que mudaria. Colisões (duas contas que viram o mesmo
 * email) nunca são alteradas: aparecem no relatório para decisão manual.
 */
import "../src/config";
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const byNormalized = new Map<string, Array<{ id: string; email: string }>>();
  for (const u of users) {
    const key = u.email.trim().toLowerCase();
    byNormalized.set(key, [...(byNormalized.get(key) ?? []), u]);
  }

  let changed = 0;
  for (const [normalized, group] of byNormalized) {
    if (group.length > 1) {
      console.warn(`COLISÃO: ${group.map((u) => u.email).join(", ")} → ${normalized} (não alterado)`);
      continue;
    }
    const [u] = group;
    if (u.email === normalized) continue;
    console.log(`${u.email} → ${normalized}`);
    if (apply) await prisma.user.update({ where: { id: u.id }, data: { email: normalized } });
    changed++;
  }
  console.log(apply ? `${changed} email(s) normalizado(s).` : `${changed} email(s) mudariam. Rode com --apply para gravar.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
