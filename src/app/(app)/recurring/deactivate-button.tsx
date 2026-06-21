"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deactivateRecurring } from "@/lib/actions/recurring";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeactivateButton({ id }: { id: string }) {
  return (
    <ConfirmDialog
      title="Desativar conta fixa?"
      description="A regra deixa de gerar novos lançamentos."
      confirmLabel="Desativar"
      onConfirm={async () => {
        await deactivateRecurring(id);
        toast.success("Conta fixa desativada");
      }}
      trigger={
        <button
          type="button"
          aria-label="Desativar"
          className="text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      }
    />
  );
}
