"use client";

import { useActionState } from "react";
import { acceptInvite, type ActionState } from "@/lib/actions/household";
import { Button } from "@/components/ui/button";

const initial: ActionState = {};

export function AcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvite, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Entrando no espaço..." : "Aceitar convite"}
      </Button>
    </form>
  );
}
