"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { payInvoice } from "@/lib/actions/cards";
import { Button } from "@/components/ui/button";

type Opt = { id: string; name: string };

const selectClass =
  "h-9 flex-1 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function PayInvoice({
  invoiceId,
  accounts,
}: {
  invoiceId: string;
  accounts: Opt[];
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [pending, start] = useTransition();

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Crie uma conta para registrar o pagamento.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        className={selectClass}
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Button
        disabled={pending || !accountId}
        onClick={() =>
          start(async () => {
            await payInvoice(invoiceId, accountId);
            toast.success("Fatura paga");
          })
        }
      >
        {pending ? "..." : "Pagar fatura"}
      </Button>
    </div>
  );
}
