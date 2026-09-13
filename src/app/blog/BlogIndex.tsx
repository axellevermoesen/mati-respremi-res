"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Tag } from "@/components/ui/Tag";

type Item = {
  kind: "article" | "podcast";
  slug: string;
  topic: string;
  title: string;
  excerpt: string;
  img: string;
  meta: string;
};
type Featured = Omit<Item, "kind">;

const FORMATS = ["Tout", "Articles", "Podcast"] as const;
type Format = (typeof FORMATS)[number];

export function BlogIndex({
  featured,
  items,
  topics,
}: {
  featured: Featured;
  items: Item[];
  topics: string[];
}) {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<Format>("Tout");
  const [topic, setTopic] = useState("Tout");

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || format !== "Tout" || topic !== "Tout";

  const shown = useMemo(
    () =>
      items.filter((it) => {
        const okF =
          format === "Tout" ||
          (format === "Podcast" ? it.kind === "podcast" : it.kind === "article");
        const okT = topic === "Tout" || it.topic === topic;
        const okQ = !q || `${it.title} ${it.excerpt} ${it.topic}`.toLowerCase().includes(q);
        return okF && okT && okQ;
      }),
    [items, format, topic, q],
  );

  return (
    <div>
      <div className="mb-9 flex flex-wrap items-baseline justify-between gap-6">
        <div>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
            Le blog
          </div>
          <h2 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
            Tout ce qu&apos;on a compris cette saison
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-[var(--text-secondary)]">
            Des articles et des épisodes. Un sujet par semaine, vérifié avant d&apos;être publié.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un sujet, un producteur…"
          className="h-11 w-full min-w-[260px] max-w-[340px] flex-1 rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none placeholder:text-[var(--text-muted)] focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-2 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Format
        </span>
        {FORMATS.map((f) => (
          <Tag key={f} selected={format === f} onClick={() => setFormat(f)}>
            {f}
          </Tag>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-9">
        <span className="mr-2 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Rubrique
        </span>
        {topics.map((t) => (
          <Tag key={t} selected={topic === t} onClick={() => setTopic(t)}>
            {t}
          </Tag>
        ))}
      </div>

      {!filtering && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group mt-10 grid overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-card)] shadow-[var(--shadow-l)] md:grid-cols-[1.1fr_1fr]"
        >
          <div className="relative min-h-[280px]">
            <Image
              src={featured.img}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-9 sm:p-12">
            <div className="flex items-center gap-2.5">
              <span className="rounded-[var(--radius-pill)] bg-rose-600 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-white">
                À la une
              </span>
              <span className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
                {featured.topic}
              </span>
            </div>
            <div className="font-display text-[clamp(24px,3vw,34px)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
              {featured.title}
            </div>
            <p className="text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {featured.excerpt}
            </p>
            <div className="text-[13px] text-[var(--text-muted)]">{featured.meta}</div>
            <span className="mt-2 inline-flex h-11 w-fit items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-semibold text-white group-hover:bg-green-900">
              Lire l&apos;article
            </span>
          </div>
        </Link>
      )}

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-l)] bg-[var(--surface-sunken)] p-16 text-center">
          <div className="font-display text-[21px] text-[var(--text-primary)]">
            Rien sous ce filtre. Ça arrive.
          </div>
          <div className="mt-2 text-[15px] text-[var(--text-secondary)]">
            Élargissez la recherche, on a sûrement écrit quelque chose à côté.
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(264px,1fr))]">
          {shown.map((it) => (
            <Link
              key={it.slug}
              href={it.kind === "article" ? `/blog/${it.slug}` : "/podcast"}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)] transition-shadow hover:shadow-[var(--shadow-l)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--sand-100)]">
                <Image
                  src={it.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {it.kind === "podcast" && (
                  <span className="absolute left-3 top-3 rounded-[var(--radius-pill)] bg-[hsl(45_30%_98%_/_0.92)] px-2.5 py-1 text-[11px] font-bold text-green-900">
                    Podcast
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  {it.topic}
                </span>
                <span className="font-display text-[var(--text-heading-s)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
                  {it.title}
                </span>
                <span className="text-[12px] text-[var(--text-muted)]">{it.meta}</span>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {it.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtering && shown.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setFormat("Tout");
            setTopic("Tout");
          }}
          className={cn(
            "mt-8 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          Tout réinitialiser
        </button>
      )}
    </div>
  );
}
