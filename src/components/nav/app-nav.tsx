"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = { seller: "Vendedor", manager: "Gerente", admin: "Admin" };

export function AppNav({ name, role, signOut }: { name: string; role: UserRole; signOut: () => Promise<void> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "Inicio" },
    { href: "/simulaciones/nueva", label: "Nueva simulación" },
    { href: "/historial", label: "Mis simulaciones" },
    ...(role !== "seller" ? [{ href: "/equipo", label: "Equipo" }] : []),
    ...(role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                active(l.href) ? "bg-foreground text-white" : "text-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-subtle">{ROLE_LABEL[role]}</div>
          </div>
          <form action={signOut}>
            <button className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-panel hover:text-foreground">Salir</button>
          </form>
        </div>
        <button className="ml-auto rounded-full p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menú">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-line px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={clsx("block rounded-xl px-3 py-2 text-sm", active(l.href) && "bg-panel font-medium")}>
              {l.label}
            </Link>
          ))}
          <form action={signOut} className="mt-2 border-t border-line pt-2">
            <button className="px-3 py-2 text-sm text-muted">Salir ({name})</button>
          </form>
        </nav>
      )}
    </header>
  );
}
