import { getSessionContext } from "@/lib/queries/household";
import { listBudgets } from "@/lib/queries/budgets";
import { listCategories } from "@/lib/queries/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { BudgetForm } from "./budget-form";

export default async function BudgetsPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const [budgets, categories] = await Promise.all([
    listBudgets(hid, new Date()),
    listCategories(hid, "expense"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground capitalize">
          {monthLabel(new Date())}
        </p>
        <h1 className="text-2xl font-semibold">Orçamentos</h1>
      </div>

      <BudgetForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />

      {budgets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum orçamento definido neste mês.
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const pct =
              b.limit_cents > 0
                ? Math.round((b.spent_cents / b.limit_cents) * 100)
                : 0;
            const over = b.spent_cents > b.limit_cents;
            const warn = pct >= 80 && !over;
            const color = b.category_color ?? "#4F46E5";
            const barColor = over ? "#EF4444" : warn ? "#F59E0B" : color;
            const remaining = b.limit_cents - b.spent_cents;
            return (
              <Card key={b.category_id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl text-xl"
                        style={{ background: `${color}22` }}
                      >
                        {b.category_icon ?? "📦"}
                      </span>
                      <div>
                        <div className="font-bold">{b.category_name}</div>
                        <div className="text-xs tabular-nums text-muted-foreground">
                          {formatCents(b.spent_cents)} / {formatCents(b.limit_cents)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className="border-transparent"
                      style={{
                        background: over
                          ? "var(--destructive)"
                          : warn
                            ? "var(--warning)"
                            : "var(--success)",
                        color: "#fff",
                      }}
                    >
                      {over ? "Excedido" : warn ? `${pct}%` : "OK"}
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Restante</span>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: over ? "var(--destructive)" : "var(--success)" }}
                    >
                      {over ? "− " : ""}
                      {formatCents(Math.abs(remaining))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
