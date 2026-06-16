"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Plus,
  PieChart,
  Menu,
  Wallet,
  Target,
  Tag,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primary = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/reports", label: "Relatórios", icon: PieChart },
  { href: "/settings", label: "Mais", icon: Menu },
];

const secondary = [
  { href: "/transactions", label: "Transações", icon: Wallet },
  { href: "/recurring", label: "Contas fixas", icon: Repeat },
  { href: "/budgets", label: "Orçamentos", icon: Tag },
  { href: "/goals", label: "Metas", icon: Target },
];

/** Bottom tab bar — mobile. FAB central abre o lançamento. */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {primary.slice(0, 2).map((it) => (
        <NavItem key={it.href} {...it} active={path.startsWith(it.href)} />
      ))}
      <Link
        href="/transactions/new"
        aria-label="Lançar"
        className="-mt-6 flex size-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-white shadow-[0_4px_16px_rgba(79,70,229,0.4)] transition-transform active:scale-95"
      >
        <Plus className="size-7" />
      </Link>
      {primary.slice(2).map((it) => (
        <NavItem key={it.href} {...it} active={path.startsWith(it.href)} />
      ))}
    </nav>
  );
}

/** Sidebar — desktop. */
export function Sidebar() {
  const path = usePathname();
  const all = [primary[0], ...secondary, primary[1], primary[2], primary[3]];
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 md:flex">
      <div className="mb-4 flex items-center gap-3 px-1">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] text-lg">
          💰
        </div>
        <div className="leading-tight">
          <div className="text-base font-extrabold">Nosso Bolso</div>
          <div className="text-[11px] text-muted-foreground">Sérgio &amp; Letícia</div>
        </div>
      </div>
      {all.map((it) => {
        const Icon = it.icon;
        const active = path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {it.label}
          </Link>
        );
      })}
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
