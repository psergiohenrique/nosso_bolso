"use client";

import { useActionState, useState } from "react";
import { createInvite, type ActionState } from "@/lib/actions/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ActionState = {};

export function InviteCard() {
  const [state, action, pending] = useActionState(createInvite, initial);
  const [copied, setCopied] = useState(false);

  const fullLink =
    state.link && typeof window !== "undefined"
      ? `${window.location.origin}${state.link}`
      : state.link;

  async function copy() {
    if (!fullLink) return;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Convide seu parceiro(a) para o espaço.
      </p>
      <form action={action} className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="E-mail (opcional)"
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Gerando..." : "Gerar convite"}
        </Button>
      </form>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      {fullLink && (
        <div className="flex gap-2">
          <Input readOnly value={fullLink} className="flex-1 text-xs" />
          <Button type="button" variant="outline" onClick={copy}>
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      )}
    </div>
  );
}
