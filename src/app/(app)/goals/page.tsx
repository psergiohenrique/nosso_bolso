import { getSessionContext } from "@/lib/queries/household";
import { listGoals } from "@/lib/queries/goals";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { goalColor } from "@/lib/brand";
import { GoalForm } from "./goal-form";
import { Contribute } from "./contribute";

export default async function GoalsPage() {
  const { membership } = await getSessionContext();
  if (!membership) return null;
  const goals = await listGoals(membership.household_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <GoalForm />
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma meta. Crie um objetivo de economia.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct =
              g.target_cents > 0
                ? Math.min(100, Math.round((g.saved_cents / g.target_cents) * 100))
                : 0;
            const color = goalColor(g.id);
            const days = g.target_date
              ? Math.ceil(
                  (new Date(g.target_date).getTime() - Date.now()) / 86_400_000,
                )
              : null;
            return (
              <Card key={g.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center gap-4">
                    <Ring pct={pct} color={color} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{g.name}</div>
                      <p className="mt-0.5 text-sm tabular-nums">
                        Guardado:{" "}
                        <span className="font-semibold">
                          {formatCents(g.saved_cents)}
                        </span>
                      </p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        Meta: {formatCents(g.target_cents)}
                      </p>
                      {days !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {days > 0 ? `${days} dias restantes` : "🎉 Meta atingida!"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Contribute id={g.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Anel de progresso SVG da meta. */
function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative size-[88px] shrink-0">
      <svg width="88" height="88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}
