"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/queries/household";
import { householdSchema } from "@/lib/validators/auth";

export type ActionState = { error?: string; message?: string; link?: string };

/** Cria o household; trigger no banco torna o criador owner + seed categorias. */
export async function createHousehold(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = householdSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("households")
    .insert({ name: parsed.data.name });
  if (error) return { error: "Não foi possível criar o espaço. Tente de novo." };

  redirect("/dashboard");
}

/** Gera um link de convite para o parceiro(a). */
export async function createInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, membership } = await getSessionContext();
  if (!user) redirect("/login");
  if (!membership) return { error: "Crie o espaço do casal primeiro." };

  const email = (formData.get("email") as string | null)?.trim() || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_invites")
    .insert({
      household_id: membership.household_id,
      email,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) return { error: "Não foi possível gerar o convite." };

  revalidatePath("/settings");
  return { link: `/invite/${data.token}` };
}

/** Aceita um convite (usuário já autenticado). Token vem do form. */
export async function acceptInvite(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Convite inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
