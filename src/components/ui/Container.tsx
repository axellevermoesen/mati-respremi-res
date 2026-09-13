import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
