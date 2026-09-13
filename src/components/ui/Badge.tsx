import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "neutral" | "secondary" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  brand: "bg-[var(--rose-100)] text-green-900",
  neutral: "bg-sand-100 text-ink-700",
  secondary: "bg-rose-100 text-[var(--accent-secondary-hover)]",
  success: "bg-green-500/15 text-green-900",
  warning: "bg-amber-600/15 text-amber-600",
  danger: "bg-terracotta-600/15 text-terracotta-600",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1",
        "font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
