"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deactivateRecurring } from "@/lib/actions/recurring";

export function DeactivateButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Desativar"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deactivateRecurring(id);
          toast.success("Conta fixa desativada");
        })
      }
      className="text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-40"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
