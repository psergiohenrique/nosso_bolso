"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/actions/transactions";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteButton({ id }: { id: string }) {
  return (
    <ConfirmDialog
      title="Excluir lançamento?"
      description="Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={async () => {
        await deleteTransaction(id);
        toast.success("Lançamento excluído");
      }}
      trigger={
        <button
          type="button"
          aria-label="Excluir"
          className="text-muted-foreground transition-colors hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="size-4" />
        </button>
      }
    />
  );
}
