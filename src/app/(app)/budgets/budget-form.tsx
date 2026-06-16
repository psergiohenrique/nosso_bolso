"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { upsertBudget, type BudgetState } from "@/lib/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Opt = { id: string; name: string };

const initial: BudgetState = {};
const selectClass =
  "h-9 flex-1 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function BudgetForm({ categories }: { categories: Opt[] }) {
  const [state, action, pending] = useActionState(upsertBudget, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Orçamento salvo");
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-2 rounded-xl border p-4">
      <div className="flex gap-2">
        <select name="categoryId" className={selectClass} required defaultValue="">
          <option value="" disabled>
            Categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input name="limit" placeholder="Limite (R$)" inputMode="decimal" className="w-36" required />
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Definir"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
