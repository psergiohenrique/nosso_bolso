"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  type CategoryState,
} from "@/lib/actions/categories";
import { categoryKindLabels } from "@/lib/validators/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Cat = {
  id: string;
  parent_id: string | null;
  name: string;
  kind: "expense" | "income";
  icon: string | null;
  color: string | null;
};

const initial: CategoryState = {};
const selectClass =
  "h-9 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function CategoriesCard({ categories }: { categories: Cat[] }) {
  const [state, action, pending] = useActionState(createCategory, initial);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Categoria criada");
      formRef.current?.reset();
      setKind("expense");
    }
  }, [state.ok]);

  // Pais possíveis: categorias raiz do mesmo tipo.
  const parents = categories.filter((c) => !c.parent_id && c.kind === kind);

  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const delButton = (c: Cat) => (
    <ConfirmDialog
      title="Excluir categoria?"
      description={
        c.parent_id
          ? `A subcategoria "${c.name}" será excluída.`
          : `A categoria "${c.name}" e suas subcategorias serão excluídas. Lançamentos ligados ficam sem categoria.`
      }
      confirmLabel="Excluir"
      onConfirm={async () => {
        await deleteCategory(c.id);
        toast.success("Categoria excluída");
      }}
      trigger={
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-40"
        >
          excluir
        </button>
      }
    />
  );

  const kinds: ("expense" | "income")[] = ["expense", "income"];

  return (
    <div className="space-y-6">
      {kinds.map((k) => {
        const roots = categories.filter((c) => !c.parent_id && c.kind === k);
        if (roots.length === 0) return null;
        return (
          <div key={k} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {categoryKindLabels[k]}
            </h3>
            <ul className="space-y-3">
              {roots.map((root) => {
                const subs = childrenOf(root.id);
                return (
                  <li key={root.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {root.icon && <span>{root.icon}</span>}
                        <span>{root.name}</span>
                      </span>
                      {delButton(root)}
                    </div>
                    {subs.length > 0 && (
                      <ul className="ml-3 border-l pl-3">
                        {subs.map((sub) => (
                          <li
                            key={sub.id}
                            className="flex items-center justify-between gap-2 py-0.5 text-sm text-muted-foreground"
                          >
                            <span className="flex items-center gap-2">
                              {sub.icon && <span>{sub.icon}</span>}
                              <span>{sub.name}</span>
                            </span>
                            {delButton(sub)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <form ref={formRef} action={action} className="space-y-2">
        <div className="flex gap-2">
          <Input name="name" placeholder="Nome da categoria" className="flex-1" required />
          <select
            name="kind"
            className={selectClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as "expense" | "income")}
          >
            {Object.entries(categoryKindLabels).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select name="parentId" className={`${selectClass} flex-1`} defaultValue="">
            <option value="">Categoria raiz (sem pai)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                Subcategoria de {p.name}
              </option>
            ))}
          </select>
          <Input name="icon" placeholder="📦" className="w-16" maxLength={8} />
          <Input name="color" placeholder="#4F46E5" className="w-28" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "..." : "Adicionar"}
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
