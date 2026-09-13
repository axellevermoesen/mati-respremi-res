import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  label?: string;
  helper?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  helper,
  placeholder,
  options,
  className,
  id,
  value,
  ...props
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  // Contrôlé si `value` est fourni, sinon on démarre sur le placeholder vide.
  const controlProps =
    value === undefined ? { defaultValue: "" } : { value };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...controlProps}
          className={cn(
            "w-full appearance-none rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 pr-10 text-[15px] text-[var(--text-primary)]",
            "shadow-[inset_0_0_0_1px_var(--border-default)] outline-none transition-shadow duration-150",
            "focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {helper && (
        <span className="text-[12px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
          {helper}
        </span>
      )}
    </div>
  );
}
