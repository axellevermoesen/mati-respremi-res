"use client";

import { cn } from "@/lib/cn";

/** Interrupteur on/off. */
export function Switch({
  checked = false,
  onChange,
  label,
  className,
}: {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-[var(--radius-pill)] transition-colors duration-150",
        checked ? "bg-green-700" : "bg-[var(--border-default)]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-[var(--shadow-s)] transition-transform duration-150",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
