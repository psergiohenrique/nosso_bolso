// Acentos visuais derivados de dados sem coluna de cor própria.
// Os tiles de cartão e os anéis de meta usam estes mapas para reproduzir
// o visual do protótipo "Nosso Bolso".

const BRAND_GRADIENTS: Record<string, [string, string]> = {
  nubank: ["#820AD1", "#4B0082"],
  itau: ["#D45A00", "#9B3E00"],
  "itaú": ["#D45A00", "#9B3E00"],
  xp: ["#0F172A", "#1E3A5F"],
  visa: ["#1A1F71", "#0F1454"],
  mastercard: ["#C2410C", "#7C2D12"],
  inter: ["#EA580C", "#9A3412"],
  c6: ["#1F2937", "#111827"],
  santander: ["#DC2626", "#991B1B"],
  bradesco: ["#B91C1C", "#7F1D1D"],
};

const FALLBACK: [string, string] = ["#4F46E5", "#7C3AED"];

/** Gradiente do tile do cartão a partir da bandeira/nome. */
export function cardGradient(brand: string | null): string {
  const key = (brand ?? "").trim().toLowerCase();
  const g = BRAND_GRADIENTS[key] ?? FALLBACK;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

const GOAL_COLORS = [
  "#4F46E5",
  "#10B981",
  "#F97316",
  "#EC4899",
  "#06B6D4",
  "#8B5CF6",
];

/** Cor de acento determinística para o anel da meta. */
export function goalColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GOAL_COLORS[h % GOAL_COLORS.length];
}
