"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Étiquette sélectionnable (choix multiple : valeurs, statut d'un produit…). */
export function Tag({
  children,
  selected = false,
  onClick,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] items-center rounded-[var(--radius-pill)] px-3.5 text-[13px] font-semibold transition-colors duration-150",
        selected
          ? "bg-green-700 text-sand-50 shadow-[var(--shadow-s)]"
          : "bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)] hover:bg-[var(--surface-sunken)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
