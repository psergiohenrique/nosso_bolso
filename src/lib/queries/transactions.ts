import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/dates";
import type { MonthSummary, TransactionRow } from "@/lib/types";

export type TxFilters = {
  start?: string;
  end?: string;
  type?: "expense" | "income" | "transfer";
  categoryId?: string;
  accountId?: string;
  cardId?: string;
  invoiceId?: string;
  search?: string;
  limit?: number;
};

export async function listTransactions(
  householdId: string,
  filters: TxFilters = {},
): Promise<TransactionRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("transactions")
    .select(
      "id, type, amount_cents, date, description, category_id, account_id, card_id, transfer_account_id, paid_by, installment_no, installment_total, category:categories(name, color, icon)",
    )
    .eq("household_id", householdId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.start) q = q.gte("date", filters.start);
  if (filters.end) q = q.lte("date", filters.end);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.accountId) q = q.eq("account_id", filters.accountId);
  if (filters.cardId) q = q.eq("card_id", filters.cardId);
  if (filters.invoiceId) q = q.eq("invoice_id", filters.invoiceId);
  if (filters.search) q = q.ilike("description", `%${filters.search}%`);

  const { data } = await q;
  return (data as unknown as TransactionRow[]) ?? [];
}

/** Resumo do mês (entradas/saídas), transferências excluídas. */
export async function getMonthSummary(
  householdId: string,
  ref: Date,
): Promise<MonthSummary> {
  const supabase = await createClient();
  const { start } = monthRange(ref);
  const { data } = await supabase
    .from("monthly_summary")
    .select("income_cents, expense_cents")
    .eq("household_id", householdId)
    .eq("month", start)
    .maybeSingle();

  return (
    (data as MonthSummary) ?? { income_cents: 0, expense_cents: 0 }
  );
}

/** Gasto por categoria no período (para gráfico de pizza). */
export async function spendingByCategory(
  householdId: string,
  start: string,
  end: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount_cents, category:categories(name, color)")
    .eq("household_id", householdId)
    .eq("type", "expense")
    .eq("is_invoice_payment", false)
    .gte("date", start)
    .lte("date", end);

  const map = new Map<string, { name: string; color: string; total: number }>();
  for (const row of (data as unknown as Array<{
    amount_cents: number;
    category: { name: string; color: string | null } | null;
  }>) ?? []) {
    const name = row.category?.name ?? "Sem categoria";
    const color = row.category?.color ?? "#94a3b8";
    const cur = map.get(name) ?? { name, color, total: 0 };
    cur.total += row.amount_cents;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
