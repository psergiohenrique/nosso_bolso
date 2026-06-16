/**
 * Dinheiro sempre em centavos (inteiro) no app e no banco.
 * Formatação só na borda de UI.
 */

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Centavos (bigint/number) -> "R$ 1.234,56" */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100);
}

/** "1.234,56" | "1234.56" | 1234.56 -> centavos inteiros */
export function toCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Divide um total em N parcelas; última absorve o resto dos centavos. */
export function splitInstallments(totalCents: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const parts = Array.from({ length: n }, () => base);
  parts[n - 1] += totalCents - base * n;
  return parts;
}
