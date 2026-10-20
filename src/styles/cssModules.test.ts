import { describe, expect, it } from "vitest";

// Toda classe usada como styles.X precisa existir no .module.css importado.
// Uma classe ausente vira `undefined` em silêncio e o elemento fica sem estilo.

const sources = import.meta.glob<string>("../**/*.tsx", { query: "?raw", import: "default", eager: true });
const sheets = import.meta.glob<string>("../**/*.module.css", { query: "?raw", import: "default", eager: true });

/** Resolve "./X.module.css" relativo ao arquivo, no formato das chaves do glob ("../a/b.css"). */
function resolveRel(file: string, rel: string): string {
  const parts = file.split("/").slice(0, -1);
  for (const seg of rel.split("/")) {
    if (seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

function declaredClasses(css: string): Set<string> {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // Só seletores (o que vem antes de "{"), para não pegar valores como "0.5rem".
  const selectors = noComments.match(/[^{}]+(?=\{)/g) ?? [];
  const out = new Set<string>();
  for (const sel of selectors) for (const m of sel.matchAll(/\.([A-Za-z_][\w-]*)/g)) out.add(m[1]);
  return out;
}

describe("CSS modules", () => {
  const files = Object.keys(sources);

  it("encontra componentes para verificar", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s só usa classes declaradas", (file) => {
    const source = sources[file];
    const imp = source.match(/import\s+(\w+)\s+from\s+"([^"]+\.module\.css)"/);
    if (!imp) return;
    const [, name, rel] = imp;
    const css = sheets[resolveRel(file, rel)];
    expect(css, `${rel} não encontrado`).toBeDefined();
    const declared = declaredClasses(css);
    const used = new Set([...source.matchAll(new RegExp(`\\b${name}\\.(\\w+)`, "g"))].map((m) => m[1]));
    const missing = [...used].filter((c) => !declared.has(c));
    expect(missing, rel).toEqual([]);
  });
});
