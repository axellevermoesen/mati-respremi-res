"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { label: "Mes producteurs", href: "/compte", icon: "leaf" },
  { label: "Mon compte", href: "/compte/profil", icon: "user" },
] as const;

function NavIcon({ name }: { name: "leaf" | "user" }) {
  const c = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return name === "leaf" ? (
    <svg {...c}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  ) : (
    <svg {...c}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

/** Menu de l'espace particulier (maquette « Espace particulier »). */
export function ConsumerNav({ name, city }: { name: string; city?: string | null }) {
  const pathname = usePathname() || "/compte";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "MP";

  return (
    <>
      <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[248px] shrink-0 flex-col gap-1 self-start overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 lg:flex">
        <div className="px-4 pb-4 pt-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Espace particulier
        </div>
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("mp-side-link", pathname === item.href && "active")}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
        <div className="mt-auto flex items-center gap-3 border-t border-[var(--border-subtle)] p-4">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-rose-600 font-display text-[13px] text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-[var(--text-primary)]">{name}</div>
            <div className="truncate text-[11px] text-[var(--text-muted)]">{city || "—"}</div>
          </div>
        </div>
      </aside>

      <div className="sticky top-[65px] z-20 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 lg:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-secondary)]",
              pathname === item.href && "bg-green-700 text-white",
            )}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
