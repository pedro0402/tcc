/** Maior valor (em módulo) aceito nos campos: acima disso o desenho dos nós quebra. */
export const FIELD_LIMIT = 999;

/**
 * Lê um campo numérico inteiro. Devolve null se estiver vazio, não for inteiro
 * (ex.: "2.9", "1e3") ou passar do limite, em vez de truncar como parseInt fazia
 * (o botão rodava com um valor diferente do que estava na tela).
 */
export function parseIntField(text: string, limit = FIELD_LIMIT): number | null {
  const t = text.trim();
  if (!/^-?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isSafeInteger(n) && Math.abs(n) <= limit ? n : null;
}
