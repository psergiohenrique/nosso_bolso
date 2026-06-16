import { getSessionContext } from "@/lib/queries/household";
import { listRecurring } from "@/lib/queries/recurring";
import { listCategories } from "@/lib/queries/categories";
import { listAccounts } from "@/lib/queries/accounts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { RecurringForm } from "./recurring-form";
import { GenerateButton } from "./generate-button";
import { DeactivateButton } from "./deactivate-button";

export default async function RecurringPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const hid = membership.household_id;

  const [rules, categories, accounts] = await Promise.all([
    listRecurring(hid, new Date()),
    listCategories(hid),
    listAccounts(hid),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Contas fixas</h1>
        <div className="flex gap-2">
          <GenerateButton />
        </div>
      </div>

      <RecurringForm
        expenseCategories={categories.filter((c) => c.kind === "expense")}
        incomeCategories={categories.filter((c) => c.kind === "income")}
        accounts={accounts.map((a) => ({ id: a.account_id, name: a.name }))}
      />

      {rules.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma conta fixa. Crie aluguel, internet, academia...
        </Card>
      ) : (
        <Card className="divide-y p-0">
          {rules.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.description}</p>
                <p className="text-xs text-muted-foreground">
                  Dia {r.day_of_month ?? "—"} · {r.category?.name ?? "sem categoria"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.generatedThisMonth ? (
                  <Badge variant="secondary">Lançada</Badge>
                ) : (
                  <Badge>A lançar</Badge>
                )}
                <span
                  className={
                    "text-sm font-semibold tabular-nums " +
                    (r.type === "income" ? "text-green-600" : "")
                  }
                >
                  {formatCents(r.amount_cents)}
                </span>
                <DeactivateButton id={r.id} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
