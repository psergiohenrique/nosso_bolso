import { getSessionContext, listMembers } from "@/lib/queries/household";
import { listAccounts } from "@/lib/queries/accounts";
import { signOut } from "@/lib/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InviteCard } from "./invite-card";
import { AccountsCard } from "./accounts-card";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage() {
  const { membership } = await getSessionContext();
  const members = membership ? await listMembers(membership.household_id) : [];
  const accounts = membership
    ? await listAccounts(membership.household_id)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mais</h1>

      <Card>
        <CardHeader>
          <CardTitle>Membros do casal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between text-sm"
            >
              <span>{m.display_name}</span>
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                {m.role === "owner" ? "Dono" : "Membro"}
              </Badge>
            </div>
          ))}
          {members.length < 2 && (
            <>
              <Separator />
              <InviteCard />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountsCard
            accounts={accounts.map((a) => ({
              id: a.account_id,
              name: a.name,
              balance: a.balance_cents,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Contas, categorias e preferências entram nas próximas fases.
      </p>
    </div>
  );
}
