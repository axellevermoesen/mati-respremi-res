import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { Button } from "@/components/ui/Button";
import { ARTICLES, EPISODES, ARTICLE_TOPICS, frDate } from "@/lib/content";
import { BlogIndex } from "./BlogIndex";

export const metadata: Metadata = {
  title: "Le blog",
  description:
    "Comment ta nourriture est produite, qui gagne quoi sur la chaîne, et ce que ça change dans l'assiette.",
};

export default function BlogPage() {
  const featured = ARTICLES.find((a) => a.featured) ?? ARTICLES[0];
  const cards = ARTICLES.filter((a) => a.slug !== featured.slug).map((a) => ({
    kind: "article" as const,
    slug: a.slug,
    topic: a.topic,
    title: a.title,
    excerpt: a.excerpt,
    img: a.img,
    meta: `${frDate(a.date)} · ${a.readMin} min de lecture`,
  }));
  const epCards = EPISODES.slice(0, 3).map((e) => ({
    kind: "podcast" as const,
    slug: e.slug,
    topic: e.topic,
    title: e.title,
    excerpt: e.excerpt,
    img: e.img,
    meta: `Épisode ${e.num} · ${e.durationLabel}`,
  }));

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex min-h-[520px] items-end">
        <Image
          src="/img/barrel-cellar-wide.jpeg"
          alt="Cave de producteur"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(150_30%_8%_/_0.86)] via-[hsl(150_30%_8%_/_0.22)] to-transparent" />
        <div className="relative mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-16">
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            Le média de Matières Premières
          </div>
          <h1 className="mt-4 font-display text-[clamp(40px,6vw,72px)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-white">
            Matières premières,
          </h1>
          <div className="mt-1.5 font-display text-[clamp(20px,2.4vw,30px)] leading-[var(--leading-snug)] text-[var(--rose-300,#d698ab)]">
            dans ton assiette.
          </div>
          <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-[hsl(45_30%_96%_/_0.85)]">
            Comment ta nourriture est produite, qui gagne quoi sur la chaîne, et ce que ça change
            dans l&apos;assiette. Des articles, un podcast, aucune leçon de morale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Button href="/producteurs" size="lg" variant="secondary">
              Découvrir les producteurs de ma région
            </Button>
            <Button
              href="/podcast"
              size="lg"
              variant="outline"
              className="border-white/60 bg-white/10 text-white hover:bg-white/20"
            >
              Écouter le podcast
            </Button>
          </div>
        </div>
      </section>

      {/* Index blog */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-20 pt-20">
        <BlogIndex
          featured={{
            slug: featured.slug,
            topic: featured.topic,
            title: featured.title,
            excerpt: featured.excerpt,
            img: featured.img,
            meta: `${frDate(featured.date)} · ${featured.readMin} min de lecture`,
          }}
          items={[...cards, ...epCards]}
          topics={ARTICLE_TOPICS}
        />
      </div>

      {/* Bandeau citation */}
      <section className="bg-green-900 px-[var(--container-pad)] py-28 text-center">
        <div className="mx-auto max-w-[760px]">
          <p className="font-display text-[clamp(26px,3vw,38px)] leading-[var(--leading-snug)] text-white">
            Savoir ce qu&apos;il y a dans ton assiette, c&apos;est déjà décider ce qu&apos;on met
            dedans demain.
          </p>
          <p className="mt-6 text-[15px] text-[var(--rose-100)]">
            On enquête sur la production. Pas sur les recettes.
          </p>
        </div>
      </section>

      {/* Teaser podcast */}
      <section className="bg-[var(--surface-sunken)] py-24">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)]">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
                Le podcast
              </div>
              <h2 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
                Des gens qui savent de quoi ils parlent
              </h2>
            </div>
            <Link
              href="/podcast"
              className="text-[14px] font-semibold text-[var(--text-secondary)] hover:text-green-900"
            >
              Tous les épisodes →
            </Link>
          </div>
          <div className="flex flex-col">
            {EPISODES.slice(0, 3).map((e) => (
              <Link
                key={e.slug}
                href="/podcast"
                className="flex flex-wrap items-center gap-4 border-b border-[var(--border-subtle)] py-4 hover:bg-[var(--surface-card)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--rose-100)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-900">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[var(--text-primary)]">
                    Ép. {e.num} — {e.title}
                  </span>
                  <span className="mt-1 block text-[12px] text-[var(--text-muted)]">
                    {e.durationLabel} · avec {e.guest}, {e.role}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-[var(--text-muted)]">
                  {frDate(e.date)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-24">
        <NewsletterBand tone="sand" />
      </div>

      <SiteFooter />
    </>
  );
}
