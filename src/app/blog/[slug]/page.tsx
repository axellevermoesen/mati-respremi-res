import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import { frDate, readingMinutes, episodeDuration, type Block } from "@/lib/content";
import { getVisibleArticle, getVisibleArticles, getVisibleEpisodes } from "@/lib/content-queries";
import { ReadingProgress } from "./ReadingProgress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getVisibleArticle(slug);
  if (!a) return { title: "Article introuvable" };
  return { title: a.metaTitle || a.title, description: a.metaDescription || a.excerpt || undefined };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getVisibleArticle(slug);
  if (!article) notFound();

  const body = article.body as unknown as Block[];
  const toc = body.filter((b): b is Extract<Block, { t: "h2" }> => b.t === "h2");

  const [allArticles, allEpisodes] = await Promise.all([getVisibleArticles(), getVisibleEpisodes()]);
  const related = allArticles.filter((a) => a.slug !== slug).slice(0, 3);
  const sideLinks = allArticles.filter((a) => a.slug !== slug).slice(0, 2);
  const latestEp = allEpisodes[0];

  return (
    <>
      <ReadingProgress />
      <SiteHeader />

      {/* En-tête */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pt-14">
        <Link
          href="/blog"
          className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-green-900"
        >
          ← Tous les contenus
        </Link>
        <div className="mt-8 max-w-[820px]">
          <div className="mb-5 flex items-center gap-2.5">
            {article.featured && (
              <span className="rounded-[var(--radius-pill)] bg-rose-600 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-white">
                À la une
              </span>
            )}
            <span className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-structural,#73986f)]">
              {article.topic}
            </span>
          </div>
          <h1 className="text-pretty font-display text-[clamp(32px,4.4vw,56px)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-[var(--text-primary)]">
            {article.title}
          </h1>
          <p className="mt-6 text-pretty text-[19px] leading-relaxed text-[var(--text-secondary)]">
            {article.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 border-b border-[var(--border-subtle)] pb-8">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--rose-100)] font-display text-[15px] text-green-900">
              {article.authorInitials}
            </span>
            <div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">
                {article.author}
              </div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {frDate(article.publishedAt!)} · {readingMinutes(body)} min de lecture
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image de couverture */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pt-8">
        <div className="overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-m)]">
          <Image
            src={article.img}
            alt=""
            width={1600}
            height={800}
            priority
            className="h-[clamp(260px,42vw,520px)] w-full object-cover"
          />
        </div>
      </div>

      {/* Corps + colonne latérale */}
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-wrap items-start gap-16 px-[var(--container-pad)] pb-10 pt-16">
        <article className="flex min-w-0 max-w-[720px] flex-[1_1_560px] flex-col gap-6 text-[18px] leading-[1.75] text-[var(--text-secondary)]">
          <BlockRenderer blocks={body} />
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-6">
            {[article.topic, "Filière", "Traçabilité"].map((t) => (
              <span
                key={t}
                className="rounded-[var(--radius-s)] bg-[var(--surface-sunken)] px-2.5 py-1 text-[12px] font-semibold text-[var(--text-secondary)]"
              >
                {t}
              </span>
            ))}
          </div>
        </article>

        <aside className="flex flex-[1_1_300px] flex-col gap-6 lg:sticky lg:top-[104px]">
          {toc.length > 0 && (
            <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
              <div className="mb-4 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Au sommaire
              </div>
              <div className="flex flex-col gap-3 text-[14px]">
                {toc.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="text-[var(--text-secondary)] hover:text-green-900"
                  >
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
            <div className="mb-4 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-structural,#73986f)]">
              Pour aller plus loin
            </div>
            <div className="flex flex-col">
              {sideLinks.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="flex items-center gap-3.5 border-b border-[var(--border-subtle)] py-3.5"
                >
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[var(--radius-s)]">
                    <Image src={a.img} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                      {a.title}
                    </span>
                    <span className="mt-1 block text-[12px] text-[var(--text-muted)]">
                      {a.topic} · {readingMinutes(a.body as unknown as Block[])} min
                    </span>
                  </span>
                </Link>
              ))}
              {latestEp && (
                <Link href="/podcast" className="flex items-center gap-3.5 py-3.5">
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[var(--radius-s)]">
                    <Image src={latestEp.img} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                      Ép. {latestEp.num} — {latestEp.title}
                    </span>
                    <span className="mt-1 block text-[12px] text-[var(--text-muted)]">
                      Podcast · {episodeDuration(latestEp.seconds).durationLabel}
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          {latestEp && (
            <div className="rounded-[var(--radius-l)] bg-[var(--surface-sunken)] p-7">
              <div className="mb-3.5 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Écouter plutôt
              </div>
              <div className="font-display text-[17px] leading-[var(--leading-snug)] text-[var(--text-primary)]">
                Ép. {latestEp.num} — {latestEp.title}
              </div>
              <div className="mt-2 text-[13px] text-[var(--text-muted)]">
                {episodeDuration(latestEp.seconds).durationLabel} · avec {latestEp.guest}
              </div>
              <Link
                href="/podcast"
                className="mt-5 inline-flex h-9 items-center rounded-[var(--radius-m)] bg-[var(--surface-card)] px-4 text-[13px] font-semibold text-green-900 shadow-[inset_0_0_0_1px_var(--border-default)] hover:bg-[var(--sand-100)]"
              >
                Écouter l&apos;épisode
              </Link>
            </div>
          )}

          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--rose-100)] font-display text-[16px] text-green-900">
                {article.authorInitials}
              </span>
              <div>
                <div className="text-[15px] font-bold text-[var(--text-primary)]">
                  {article.author}
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">
                  Autrice de Matières Premières
                </div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Elle passe plus de temps dans les caves et les hangars que devant un tableur. Ça se
              voit dans les articles.
            </p>
          </div>
        </aside>
      </div>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-24 pt-6">
        <NewsletterBand
          title="La suite de cette enquête arrive jeudi."
          text=""
        />
      </div>

      {/* À lire ensuite */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-24">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)]">
          <div className="mb-9 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-structural,#73986f)]">
                À lire ensuite
              </div>
              <h2 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
                Trois articles dans la même veine
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-[14px] font-semibold text-[var(--text-secondary)] hover:text-green-900"
            >
              Tous les contenus →
            </Link>
          </div>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)] transition-shadow hover:shadow-[var(--shadow-l)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--sand-100)]">
                  <Image
                    src={a.img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-5">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    {a.topic}
                  </span>
                  <span className="font-display text-[var(--text-heading-s)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
                    {a.title}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {frDate(a.publishedAt!)} · {readingMinutes(a.body as unknown as Block[])} min
                  </span>
                  <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                    {a.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
