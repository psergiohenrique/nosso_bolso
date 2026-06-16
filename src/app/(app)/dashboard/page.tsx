import { getSessionContext } from "@/lib/queries/household";
import { listAccounts } from "@/lib/queries/accounts";
import {
  getMonthSummary,
  spendingByCategory,
} from "@/lib/queries/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { monthLabel, monthRange } from "@/lib/dates";
import { CategoryChart } from "./category-chart";

export default async function DashboardPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const now = new Date();
  const { start, end } = monthRange(now);

  const [summary, accounts, byCategory] = await Promise.all([
    getMonthSummary(hid, now),
    listAccounts(hid),
    spendingByCategory(hid, start, end),
  ]);

  const balance = summary.income_cents - summary.expense_cents;
  const totalInAccounts = accounts.reduce((s, a) => s + a.balance_cents, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground capitalize">
          {monthLabel(now)}
        </p>
        <h1 className="text-2xl font-semibold">Início</h1>
      </header>

      <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] p-6 text-white shadow-[0_8px_32px_rgba(79,70,229,0.3)]">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/[0.08]" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 size-48 rounded-full bg-white/[0.05]" />
        <div className="relative">
          <p className="text-xs font-medium text-white/80">Saldo do mês</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">
            {formatCents(balance)}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <HeroStat label="Entradas" value={formatCents(summary.income_cents)} />
            <HeroStat label="Saídas" value={formatCents(summary.expense_cents)} />
            <HeroStat label="Saldo contas" value={formatCents(totalInAccounts)} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryChart data={byCategory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conta. Crie em “Mais”.
            </p>
          ) : (
            accounts.map((a) => (
              <div
                key={a.account_id}
                className="flex items-center justify-between text-sm"
              >
                <span>{a.name}</span>
                <span className="tabular-nums">
                  {formatCents(a.balance_cents)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.14] px-2.5 py-2.5">
      <p className="text-[10px] font-medium text-white/80">{label}</p>
      <p className="mt-0.5 text-xs font-bold tabular-nums">{value}</p>
    </div>
  );
}
