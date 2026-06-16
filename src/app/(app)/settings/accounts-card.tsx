"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  createAccount,
  archiveAccount,
  type AccountState,
} from "@/lib/actions/accounts";
import { accountTypeLabels } from "@/lib/validators/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";

type Acc = { id: string; name: string; balance: number };

const initial: AccountState = {};
const selectClass =
  "h-9 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function AccountsCard({ accounts }: { accounts: Acc[] }) {
  const [state, action, pending] = useActionState(createAccount, initial);
  const [archiving, startArchive] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Conta criada");
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{a.name}</span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums text-muted-foreground">
                  {formatCents(a.balance)}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-40"
                  disabled={archiving}
                  onClick={() =>
                    startArchive(async () => {
                      await archiveAccount(a.id);
                      toast.success("Conta arquivada");
                    })
                  }
                >
                  arquivar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={action} className="space-y-2">
        <div className="flex gap-2">
          <Input name="name" placeholder="Nome da conta" className="flex-1" required />
          <select name="type" className={selectClass} defaultValue="checking">
            {Object.entries(accountTypeLabels).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Input
            name="initialBalance"
            placeholder="Saldo inicial (R$)"
            inputMode="decimal"
            className="flex-1"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "..." : "Adicionar"}
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
