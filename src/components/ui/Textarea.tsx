import type { ComponentPropsWithoutRef } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  label?: string;
  helper?: string;
};

export function Textarea({ label, helper, className, id, ...props }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={areaId}
          className="text-[13px] font-semibold text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={cn(
          "w-full resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-primary)]",
          "shadow-[inset_0_0_0_1px_var(--border-default)] outline-none placeholder:text-[var(--text-muted)]",
          "transition-shadow duration-150",
          "focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]",
          className,
        )}
        {...props}
      />
      {helper && (
        <span className="text-[12px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
          {helper}
        </span>
      )}
    </div>
  );
}
