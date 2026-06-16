import { getSessionContext } from "@/lib/queries/household";
import { getReportData, type Basis } from "@/lib/queries/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { monthLabel, monthRange } from "@/lib/dates";
import { format, subMonths, startOfMonth } from "date-fns";
import { TrendChart, DonutChart } from "./charts";
import { BasisToggle } from "./basis-toggle";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ basis?: string }>;
}) {
  const sp = await searchParams;
  const basis: Basis = sp.basis === "caixa" ? "caixa" : "competencia";

  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const now = new Date();
  const { start: monthStart, end: monthEnd } = monthRange(now);
  const trendStart = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");

  const [period, trend] = await Promise.all([
    getReportData(hid, monthStart, monthEnd, basis),
    getReportData(hid, trendStart, monthEnd, basis),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground capitalize">
            {monthLabel(now)}
          </p>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
        </div>
        <BasisToggle basis={basis} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendência (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend.byMonth} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart data={period.byCategory} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={period.byMethod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por pessoa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {period.byMember.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              period.byMember.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{m.name}</span>
                  <span className="tabular-nums">{formatCents(m.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acerto do casal</CardTitle>
        </CardHeader>
        <CardContent>
          {period.settlement.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Precisa de 2 pessoas com gastos para calcular.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {period.settlement.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span>{s.name} pagou</span>
                  <span className="tabular-nums">{formatCents(s.paid)}</span>
                </div>
              ))}
              <Settlement settlement={period.settlement} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Settlement({
  settlement,
}: {
  settlement: { name: string; balance: number }[];
}) {
  const creditor = settlement.find((s) => s.balance > 0);
  const debtor = settlement.find((s) => s.balance < 0);
  if (!creditor || !debtor || Math.abs(creditor.balance) < 1) {
    return (
      <p className="pt-2 text-sm font-medium text-green-600">
        Contas equilibradas 🎉
      </p>
    );
  }
  return (
    <p className="pt-2 text-sm font-medium">
      {debtor.name} deve {formatCents(Math.abs(debtor.balance))} a{" "}
      {creditor.name} para igualar.
    </p>
  );
}
