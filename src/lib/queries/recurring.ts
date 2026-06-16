import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/dates";

export type RecurringRule = {
  id: string;
  description: string;
  amount_cents: number;
  type: "expense" | "income";
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  category: { name: string } | null;
};

/** Regras + flag "já lançada neste mês". */
export async function listRecurring(householdId: string, ref: Date) {
  const supabase = await createClient();
  const { start, end } = monthRange(ref);

  const { data: rules } = await supabase
    .from("recurring_rules")
    .select(
      "id, description, amount_cents, type, day_of_month, start_date, end_date, active, category:categories(name)",
    )
    .eq("household_id", householdId)
    .eq("active", true)
    .order("day_of_month");

  const { data: generated } = await supabase
    .from("transactions")
    .select("recurring_rule_id")
    .eq("household_id", householdId)
    .gte("date", start)
    .lte("date", end)
    .not("recurring_rule_id", "is", null);

  const done = new Set(
    (generated as { recurring_rule_id: string }[] | null)?.map(
      (g) => g.recurring_rule_id,
    ) ?? [],
  );

  return ((rules as unknown as RecurringRule[]) ?? []).map((r) => ({
    ...r,
    generatedThisMonth: done.has(r.id),
  }));
}
