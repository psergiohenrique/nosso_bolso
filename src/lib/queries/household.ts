import { createClient } from "@/lib/supabase/server";

export type Membership = {
  household_id: string;
  role: "owner" | "member";
  display_name: string;
};

/** Usuário atual + sua associação a um household (ou null). */
export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, membership: null as Membership | null };

  const { data } = await supabase
    .from("household_members")
    .select("household_id, role, display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return { user, membership: (data as Membership) ?? null };
}

/** Membros do household atual (para tela de configurações). */
export async function listMembers(householdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, display_name, color, joined_at")
    .eq("household_id", householdId)
    .order("joined_at");
  return data ?? [];
}
