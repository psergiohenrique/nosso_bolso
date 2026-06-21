"use client";

import { useState, useTransition, type ReactElement } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Dialog de confirmação para ações destrutivas.
 * `trigger` é o elemento que abre o dialog (botão/ícone).
 * `onConfirm` roda dentro de uma transition; o dialog fecha ao concluir.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Excluir",
  onConfirm,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {pending ? "..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
