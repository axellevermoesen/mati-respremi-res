import Image from "next/image";
import Link from "next/link";
import type { PostKind } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import {
  POST_KIND_COLOR,
  POST_KIND_LABEL,
  bodyFor,
  farmInitials,
  frShortDate,
  type Audience,
} from "@/lib/posts";

export type PostCardData = {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  bodyPro: string | null;
  imageUrl: string | null;
  eventDate: Date | null;
  eventTime: string | null;
  eventPlace: string | null;
  productName: string | null;
  productNote: string | null;
  restaurantName: string | null;
  restaurantPlace: string | null;
  createdAt: Date;
  producer: {
    slug: string;
    farmName: string;
    city: string | null;
    region: string;
    logoUrl: string | null;
  };
};

/** Une actu producteur, telle que la maquette « Espace particulier » la présente. */
export function PostCard({
  post,
  audience,
  showProducer = true,
  footer,
}: {
  post: PostCardData;
  audience: Audience;
  showProducer?: boolean;
  footer?: React.ReactNode;
}) {
  const text = bodyFor(post, audience);
  const place = post.producer.city || post.producer.region;

  return (
    <article className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-s)]">
      <div className="flex items-center gap-3">
        {showProducer ? (
          <>
            <ProducerAvatar name={post.producer.farmName} logoUrl={post.producer.logoUrl} size={40} />
            <div className="min-w-0 flex-1">
              <Link
                href={`/producteurs/${post.producer.slug}`}
                className="block truncate text-[14px] font-bold text-[var(--text-primary)] hover:text-[var(--text-brand)]"
              >
                {post.producer.farmName}
              </Link>
              <div className="text-[12px] text-[var(--text-muted)]">
                {[place, frShortDate(post.createdAt)].filter(Boolean).join(" · ")}
              </div>
            </div>
          </>
        ) : (
          <div className="min-w-0 flex-1 text-[12px] text-[var(--text-muted)]">
            {frShortDate(post.createdAt)}
          </div>
        )}
        <span
          className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)]"
          style={{ color: POST_KIND_COLOR[post.kind] }}
        >
          {POST_KIND_LABEL[post.kind]}
        </span>
      </div>

      <h3 className="mt-[18px] font-display text-[18px] leading-[var(--leading-snug)] text-[var(--text-primary)] [text-wrap:pretty]">
        {post.title}
      </h3>
      {text && (
        <p className="mt-2 whitespace-pre-line text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)] [text-wrap:pretty]">
          {text}
        </p>
      )}

      {post.imageUrl && (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="(min-width: 960px) 800px, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {post.kind === "EVENT" && post.eventDate && (
        <div className="mt-4 flex items-center gap-3.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
          <div className="w-[52px] shrink-0 rounded-[var(--radius-s)] bg-[var(--surface-card)] py-1.5 text-center shadow-[var(--shadow-s)]">
            <div className="font-display text-[20px] leading-[1.1] text-green-900">
              {post.eventDate.getDate()}
            </div>
            <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
              {post.eventDate.toLocaleDateString("fr-FR", { month: "short" })}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[var(--text-primary)]">
              {capitalize(
                post.eventDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }),
              )}
              {post.eventTime ? `, ${post.eventTime}` : ""}
            </div>
            {post.eventPlace && (
              <div className="text-[13px] text-[var(--text-muted)]">{post.eventPlace}</div>
            )}
          </div>
        </div>
      )}

      {post.kind === "PRODUCT" && post.productName && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
          <div>
            <div className="text-[14px] font-bold text-[var(--text-primary)]">{post.productName}</div>
            {post.productNote && (
              <div className="text-[13px] text-[var(--text-muted)]">{post.productNote}</div>
            )}
          </div>
          <Badge tone="neutral">Nouveau</Badge>
        </div>
      )}

      {post.kind === "RESTAURANT" && post.restaurantName && (
        <div className="mt-4 rounded-[var(--radius-m)] px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            À la carte chez
          </div>
          <div className="mt-0.5 text-[14px] font-bold text-[var(--text-primary)]">
            {post.restaurantName}
          </div>
          {post.restaurantPlace && (
            <div className="text-[13px] text-[var(--text-muted)]">{post.restaurantPlace}</div>
          )}
        </div>
      )}

      {footer}
    </article>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ProducerAvatar({
  name,
  logoUrl,
  size,
  rounded = "full",
}: {
  name: string;
  logoUrl?: string | null;
  size: number;
  rounded?: "full" | "m";
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-[var(--radius-m)]";
  if (logoUrl) {
    return (
      <span
        className={`relative shrink-0 overflow-hidden bg-[var(--surface-sunken)] ${radius}`}
        style={{ width: size, height: size }}
      >
        <Image src={logoUrl} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      </span>
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-green-700 font-display text-white ${radius}`}
      style={{ width: size, height: size, fontSize: Math.round(size / 3) }}
    >
      {farmInitials(name)}
    </span>
  );
}
