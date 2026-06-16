import { createClient } from "@/lib/supabase/server";
import type { Card, Invoice } from "@/lib/types";

export type CardWithUsage = Card & { used_cents: number };

/** Cartões do household + uso atual (soma de faturas não pagas). */
export async function listCards(
  householdId: string,
): Promise<CardWithUsage[]> {
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("cards")
    .select(
      "id, name, brand, last4, limit_cents, closing_day, due_day, default_account_id, archived",
    )
    .eq("household_id", householdId)
    .eq("archived", false)
    .order("name");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("card_id, total_cents, status")
    .eq("household_id", householdId)
    .neq("status", "paid");

  const usage = new Map<string, number>();
  for (const inv of (invoices as { card_id: string; total_cents: number }[]) ??
    []) {
    usage.set(inv.card_id, (usage.get(inv.card_id) ?? 0) + inv.total_cents);
  }

  return ((cards as Card[]) ?? []).map((c) => ({
    ...c,
    used_cents: usage.get(c.id) ?? 0,
  }));
}

export async function getCard(id: string): Promise<Card | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cards")
    .select(
      "id, name, brand, last4, limit_cents, closing_day, due_day, default_account_id, archived",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as Card) ?? null;
}

export async function listInvoices(cardId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, card_id, period_start, period_end, due_date, total_cents, status, paid_at",
    )
    .eq("card_id", cardId)
    .order("period_start", { ascending: false });
  return (data as Invoice[]) ?? [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, card_id, period_start, period_end, due_date, total_cents, status, paid_at",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as Invoice) ?? null;
}
