"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { label: string; href: string | null; icon: string; match?: string };

const ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/compte", icon: "grid", match: "/compte" },
  { label: "Commandes", href: "/compte/commandes", icon: "box", match: "/compte/commandes" },
  { label: "Mes produits", href: "/compte/produits", icon: "leaf", match: "/compte/produits" },
  { label: "Ma page", href: "/compte/ma-page", icon: "store", match: "/compte/ma-page" },
  {
    label: "Tournée mutualisée",
    href: "/compte/tournees",
    icon: "truck",
    match: "/compte/tournees",
  },
  { label: "Réseau producteurs", href: null, icon: "users" },
];

function isActive(pathname: string, item: NavItem) {
  if (!item.match) return false;
  if (item.match === "/compte") return pathname === "/compte";
  return pathname === item.match || pathname.startsWith(item.match + "/");
}

function NavIcon({ name }: { name: string }) {
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
  switch (name) {
    case "grid":
      return (
        <svg {...c}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "box":
      return (
        <svg {...c}>
          <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
          <path d="m3 8 9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...c}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      );
    case "store":
      return (
        <svg {...c}>
          <path d="m2 7 2-4h16l2 4" />
          <path d="M4 7v13h16V7" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "truck":
      return (
        <svg {...c}>
          <path d="M10 17h4V5H2v12h3" />
          <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
          <circle cx="7.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    default:
      return (
        <svg {...c}>
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
  }
}

export function ProducerNav({
  farmName,
  location,
  avatarUrl,
}: {
  farmName: string;
  location?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname() || "/compte";

  return (
    <>
      {/* Menu latéral — écrans larges */}
      <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[248px] shrink-0 flex-col gap-1 self-start overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 lg:flex">
        <div className="px-4 pb-4 pt-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Espace producteur
        </div>
        {ITEMS.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={cn("mp-side-link", isActive(pathname, item) && "active")}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="mp-side-link"
              aria-disabled="true"
              title="Bientôt"
            >
              <NavIcon name={item.icon} />
              {item.label}
            </span>
          ),
        )}
        <div className="mt-auto flex items-center gap-3 border-t border-[var(--border-subtle)] p-4">
          {avatarUrl ? (
            <span className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full">
              <Image src={avatarUrl} alt="" fill className="object-cover" sizes="38px" unoptimized />
            </span>
          ) : (
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-green-700 font-display text-[13px] text-white">
              {(farmName || "MP").slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-[var(--text-primary)]">
              {farmName || "Mon exploitation"}
            </div>
            <div className="truncate text-[11px] text-[var(--text-muted)]">{location || "—"}</div>
          </div>
        </div>
      </aside>

      {/* Barre de navigation — écrans étroits */}
      <div className="sticky top-[65px] z-20 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 lg:hidden">
        {ITEMS.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-secondary)]",
                isActive(pathname, item) && "bg-green-700 text-white",
              )}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              aria-disabled="true"
              title="Bientôt"
              className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-muted)] opacity-60"
            >
              <NavIcon name={item.icon} />
              {item.label}
            </span>
          ),
        )}
      </div>
    </>
  );
}
