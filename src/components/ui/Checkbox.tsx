import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label?: string;
};

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className="inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--text-secondary)]"
    >
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "h-[18px] w-[18px] shrink-0 rounded-[5px] accent-[var(--accent-primary)]",
          className,
        )}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
