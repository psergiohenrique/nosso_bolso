"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createTransaction,
  type TxState,
} from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category, TxType } from "@/lib/types";

type Opt = { id: string; name: string };

const initial: TxState = {};
const today = () => new Date().toISOString().slice(0, 10);

const TYPES: { key: TxType; label: string }[] = [
  { key: "expense", label: "Despesa" },
  { key: "income", label: "Receita" },
  { key: "transfer", label: "Transferência" },
];

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  members,
}: {
  accounts: Opt[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  members: Opt[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createTransaction, initial);
  const [type, setType] = useState<TxType>("expense");

  useEffect(() => {
    if (state.ok) {
      toast.success("Lançamento salvo");
      router.push("/transactions");
    }
  }, [state.ok, router]);

  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      {/* tipo */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={cn(
              "rounded-md py-1.5 text-sm transition-colors",
              type === t.key
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* valor */}
      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
          required
          className="text-lg"
        />
      </div>

      {/* categoria (não em transferência) */}
      {type !== "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <select id="categoryId" name="categoryId" className={selectClass}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? "— " : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* conta (origem) */}
      <div className="space-y-2">
        <Label htmlFor="accountId">
          {type === "transfer" ? "De (conta origem)" : "Conta"}
        </Label>
        <select id="accountId" name="accountId" className={selectClass} required>
          <option value="">Selecione</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* conta destino (transferência) */}
      {type === "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="transferAccountId">Para (conta destino)</Label>
          <select
            id="transferAccountId"
            name="transferAccountId"
            className={selectClass}
            required
          >
            <option value="">Selecione</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* quem pagou (não em transferência) */}
      {type !== "transfer" && members.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="paidBy">Quem pagou</Label>
          <select id="paidBy" name="paidBy" className={selectClass}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* data */}
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={today()}
          required
        />
      </div>

      {/* descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" name="description" placeholder="Ex: Mercado" />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
