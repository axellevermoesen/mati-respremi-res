import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Carte produit / contenu.
 * Reprend la structure des maquettes : image en haut, sur-titre (eyebrow) en
 * mono, titre en display, sous-titre discret.
 */
export function Card({
  image,
  imageAlt = "",
  eyebrow,
  title,
  subtitle,
  href,
  footer,
  className,
}: {
  image?: string;
  imageAlt?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      {image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-5">
        {eyebrow && (
          <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            {eyebrow}
          </span>
        )}
        <h3 className="text-[var(--text-heading-s)] leading-snug text-[var(--text-primary)]">
          {title}
        </h3>
        {subtitle && (
          <span className="text-[13px] text-[var(--text-muted)]">{subtitle}</span>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </>
  );

  const shell = cn(
    "group flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)]",
    "shadow-[var(--shadow-m)] transition-shadow duration-200 hover:shadow-[var(--shadow-l)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {inner}
      </Link>
    );
  }
  return <div className={shell}>{inner}</div>;
}
