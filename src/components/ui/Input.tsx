import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  label?: string;
  helper?: string;
  error?: string;
};

export function Input({ label, helper, error, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] text-[var(--text-primary)]",
          "shadow-[inset_0_0_0_1px_var(--border-default)] outline-none",
          "placeholder:text-[var(--text-muted)]",
          "transition-shadow duration-150",
          "focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]",
          error &&
            "shadow-[inset_0_0_0_1px_var(--state-danger)] focus:shadow-[0_0_0_3px_hsl(9_49%_48%_/_0.18),inset_0_0_0_1px_var(--state-danger)]",
          className,
        )}
        {...props}
      />
      {(helper || error) && (
        <span
          className={cn(
            "text-[12px] leading-[var(--leading-relaxed)]",
            error ? "text-[var(--state-danger)]" : "text-[var(--text-muted)]",
          )}
        >
          {error ?? helper}
        </span>
      )}
    </div>
  );
}
