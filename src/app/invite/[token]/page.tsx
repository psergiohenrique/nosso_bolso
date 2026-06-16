import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { AcceptForm } from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc("get_invite", { p_token: token });
  const invite = Array.isArray(data) ? data[0] : data;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {!invite ? (
          <Msg title="Convite inválido" sub="Esse link não existe." />
        ) : invite.accepted ? (
          <Msg title="Convite já utilizado" sub="Esse convite já foi aceito." />
        ) : invite.expired ? (
          <Msg title="Convite expirado" sub="Peça um novo link ao parceiro(a)." />
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Convite</h1>
              <p className="text-sm text-muted-foreground">
                Você foi convidado(a) para o espaço{" "}
                <strong>{invite.household_name}</strong>.
              </p>
            </div>
            {user ? (
              <AcceptForm token={token} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Entre ou crie uma conta para aceitar.
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/login?next=/invite/${token}`}
                    className={buttonVariants({ className: "flex-1" })}
                  >
                    Entrar
                  </Link>
                  <Link
                    href={`/signup?next=/invite/${token}`}
                    className={buttonVariants({
                      variant: "outline",
                      className: "flex-1",
                    })}
                  >
                    Criar conta
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Msg({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{sub}</p>
      <Link href="/login" className={buttonVariants({ variant: "link" })}>
        Voltar ao login
      </Link>
    </div>
  );
}
