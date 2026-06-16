import { createClient } from "@/lib/supabase/server";
import type { AccountBalance } from "@/lib/types";

/** Contas do household com saldo atual (view account_balances). */
export async function listAccounts(
  householdId: string,
  includeArchived = false,
): Promise<AccountBalance[]> {
  const supabase = await createClient();
  let q = supabase
    .from("account_balances")
    .select("account_id, name, type, archived, balance_cents")
    .eq("household_id", householdId)
    .order("name");
  if (!includeArchived) q = q.eq("archived", false);

  const { data } = await q;
  return (data as AccountBalance[]) ?? [];
}
