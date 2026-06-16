import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/dates";

export type BudgetRow = {
  category_id: string;
  category_name: string;
  category_color: string | null;
  category_icon: string | null;
  limit_cents: number;
  spent_cents: number;
};

/** Orçamentos do mês + gasto realizado por categoria. */
export async function listBudgets(
  householdId: string,
  ref: Date,
): Promise<BudgetRow[]> {
  const supabase = await createClient();
  const { start, end } = monthRange(ref);

  const { data: budgets } = await supabase
    .from("budgets")
    .select("category_id, limit_cents, category:categories(name, color, icon)")
    .eq("household_id", householdId)
    .eq("month", start);

  const { data: txs } = await supabase
    .from("transactions")
    .select("category_id, amount_cents")
    .eq("household_id", householdId)
    .eq("type", "expense")
    .eq("is_invoice_payment", false)
    .gte("date", start)
    .lte("date", end)
    .not("category_id", "is", null);

  const spent = new Map<string, number>();
  for (const t of (txs as { category_id: string; amount_cents: number }[]) ??
    []) {
    spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + t.amount_cents);
  }

  return (
    (budgets as unknown as Array<{
      category_id: string;
      limit_cents: number;
      category: { name: string; color: string | null; icon: string | null } | null;
    }>) ?? []
  ).map((b) => ({
    category_id: b.category_id,
    category_name: b.category?.name ?? "Categoria",
    category_color: b.category?.color ?? null,
    category_icon: b.category?.icon ?? null,
    limit_cents: b.limit_cents,
    spent_cents: spent.get(b.category_id) ?? 0,
  }));
}
