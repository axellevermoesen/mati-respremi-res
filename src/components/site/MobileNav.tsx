"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { label: string; href: string };

export function MobileNav({
  navItems,
  loggedIn,
  logoutAction,
}: {
  navItems: NavItem[];
  loggedIn: boolean;
  logoutAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="grid h-10 w-10 place-items-center rounded-[var(--radius-m)] text-green-900 hover:bg-[var(--surface-sunken)]"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-[var(--border-subtle)] bg-[hsl(45_30%_98%_/_0.98)] px-5 py-3 shadow-[var(--shadow-m)] backdrop-blur-[10px]">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-s)] px-2 py-3 text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex flex-col border-t border-[var(--border-subtle)] pt-2">
            {loggedIn ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-[var(--radius-s)] px-2 py-3 text-left text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
                >
                  Se déconnecter
                </button>
              </form>
            ) : (
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-s)] px-2 py-3 text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
              >
                Espace producteur
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
