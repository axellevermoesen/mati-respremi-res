import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-m)] " +
  "transition-colors duration-150 focus-visible:shadow-[var(--shadow-focus)] " +
  "disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-green-700 text-sand-50 hover:bg-green-900",
  secondary: "bg-rose-600 text-white hover:bg-[var(--accent-secondary-hover)]",
  outline:
    "bg-transparent text-green-900 shadow-[inset_0_0_0_1.5px_var(--green-900)] hover:bg-sand-100",
  ghost: "bg-transparent text-green-900 hover:bg-sand-100",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-7 text-[16px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    return (
      <Link className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
