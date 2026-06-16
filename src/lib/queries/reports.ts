import { createClient } from "@/lib/supabase/server";
import { listMembers } from "@/lib/queries/household";
import { format } from "date-fns";

export type Basis = "competencia" | "caixa";

type RawTx = {
  date: string;
  type: "expense" | "income" | "transfer";
  amount_cents: number;
  card_id: string | null;
  account_id: string | null;
  is_invoice_payment: boolean;
  paid_by: string | null;
  category: { name: string; color: string | null } | null;
};

/** Uma despesa entra na visão? competência = exclui pagamento de fatura;
 *  caixa = exclui compras de cartão (conta saída real da conta). */
function expenseInBasis(t: RawTx, basis: Basis): boolean {
  if (t.type !== "expense") return false;
  return basis === "competencia" ? !t.is_invoice_payment : t.card_id === null;
}

export async function getReportData(
  householdId: string,
  start: string,
  end: string,
  basis: Basis,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(
      "date, type, amount_cents, card_id, account_id, is_invoice_payment, paid_by, category:categories(name, color)",
    )
    .eq("household_id", householdId)
    .gte("date", start)
    .lte("date", end);

  const rows = (data as unknown as RawTx[]) ?? [];
  const members = await listMembers(householdId);
  const memberName = new Map(members.map((m) => [m.user_id, m.display_name]));

  // por categoria (despesas)
  const byCatMap = new Map<string, { name: string; color: string; total: number }>();
  // por mês
  const byMonthMap = new Map<string, { income: number; expense: number }>();
  // por membro (quem pagou despesa)
  const byMemberMap = new Map<string, number>();
  // por forma de pagamento
  let cardTotal = 0;
  let accountTotal = 0;

  for (const t of rows) {
    const monthKey = t.date.slice(0, 7);
    const m = byMonthMap.get(monthKey) ?? { income: 0, expense: 0 };

    if (t.type === "income") {
      m.income += t.amount_cents;
    } else if (expenseInBasis(t, basis)) {
      m.expense += t.amount_cents;

      const name = t.category?.name ?? "Sem categoria";
      const color = t.category?.color ?? "#94a3b8";
      const c = byCatMap.get(name) ?? { name, color, total: 0 };
      c.total += t.amount_cents;
      byCatMap.set(name, c);

      const who = t.paid_by ? (memberName.get(t.paid_by) ?? "—") : "—";
      byMemberMap.set(who, (byMemberMap.get(who) ?? 0) + t.amount_cents);

      if (t.card_id) cardTotal += t.amount_cents;
      else accountTotal += t.amount_cents;
    }
    byMonthMap.set(monthKey, m);
  }

  const byCategory = [...byCatMap.values()].sort((a, b) => b.total - a.total);
  const byMonth = [...byMonthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month: format(new Date(month + "-01"), "MMM/yy"),
      income: v.income,
      expense: v.expense,
    }));
  const byMember = [...byMemberMap.entries()].map(([name, total]) => ({
    name,
    total,
  }));
  const byMethod = [
    { name: "Cartão", color: "#6366f1", total: cardTotal },
    { name: "Conta", color: "#10b981", total: accountTotal },
  ].filter((x) => x.total > 0);

  // acerto do casal (informativo): assume divisão 50/50 do total de despesas
  const totalExpense = byMember.reduce((s, m) => s + m.total, 0);
  const fair = totalExpense / 2;
  const settlement = byMember.map((m) => ({
    name: m.name,
    paid: m.total,
    balance: m.total - fair, // positivo = pagou a mais (tem a receber)
  }));

  return { byCategory, byMonth, byMember, byMethod, settlement };
}
