"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { categorySchema } from "@/lib/validators/category";

export type CategoryState = { error?: string; ok?: boolean };

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const { membership } = await getSessionContext();
  if (!membership) return { error: "Sessão inválida." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    parentId: formData.get("parentId"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    household_id: membership.household_id,
    parent_id: parsed.data.parentId ?? null,
    name: parsed.data.name,
    kind: parsed.data.kind,
    icon: parsed.data.icon ?? null,
    color: parsed.data.color ?? null,
  });
  if (error) return { error: "Não foi possível criar a categoria." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/settings");
}
