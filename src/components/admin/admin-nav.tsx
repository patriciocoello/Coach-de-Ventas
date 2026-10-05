"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/conocimiento", label: "Manual y documentos" },
  { href: "/admin/escenarios", label: "Escenarios y dificultad" },
  { href: "/admin/score", label: "Criterios de score" },
  { href: "/admin/perfiles", label: "Perfiles predeterminados" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      <div className="eyebrow mb-2 hidden px-3 lg:block">Administración</div>
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx("whitespace-nowrap rounded-xl px-3 py-2 text-sm", active ? "bg-panel font-medium text-foreground" : "text-muted hover:text-foreground")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
