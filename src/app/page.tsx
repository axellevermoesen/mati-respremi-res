import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getHomeContent, getVisibleArticles, getVisibleEpisodes } from "@/lib/content-queries";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { plural } from "@/lib/posts";
import { readingMinutes, type Block } from "@/lib/content";

// Les derniers articles et épisodes publiés depuis l'admin.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await getHomeContent();
  const [allArticles, allEpisodes, portrait, catalogue] = await Promise.all([
    home.content.show ? getVisibleArticles().catch(() => []) : Promise.resolve([]),
    home.content.show ? getVisibleEpisodes().catch(() => []) : Promise.resolve([]),
    home.portrait.show ? getPortrait(home.portrait.producerId) : Promise.resolve(null),
    home.catalogue.show ? getCatalogueTeaser(home.catalogue.productIds) : Promise.resolve(null),
  ]);
  const articles = allArticles.slice(0, 3).map((a) => ({
    slug: a.slug,
    title: a.title,
    meta: `${a.topic} · ${readingMinutes(a.body as unknown as Block[])} min de lecture`,
  }));
  const episode = allEpisodes[0];
  const { hero, steps, network, manifesto } = home;

  const portraitText =
    home.portrait.text ||
    portrait?.tagline ||
    (portrait?.description ?? "").split(/\n{2,}/)[0] ||
    "";
  const portraitImage = home.portrait.image || portrait?.coverUrl || "";
  const portraitStats = portrait
    ? ([
        portrait.foundedYear ? [String(portrait.foundedYear), "Fondée en"] : null,
        [String(portrait._count.products), "Produits au catalogue"],
        portrait._count.connectionsFrom
          ? [String(portrait._count.connectionsFrom), "Producteurs recommandés"]
          : null,
      ].filter(Boolean) as [string, string][])
    : [];

  return (
    <>
      <SiteHeader />

      <main>
        {/* HERO */}
        {hero.show && (
          <section className="relative flex h-[640px] items-end bg-green-900">
            {hero.image && (
              <Image src={hero.image} alt="" fill priority sizes="100vw" className="object-cover" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(150_30%_8%_/_0.82),hsl(150_30%_8%_/_0.15)_55%,transparent_75%)]" />
            <Container className="relative pb-16">
              {hero.kicker && (
                <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-300">
                  {hero.kicker}
                </div>
              )}
              <h1 className="mt-4 max-w-[820px] whitespace-pre-line font-display text-[clamp(36px,4.5vw,60px)] leading-[var(--leading-tight)] text-white">
                {hero.title}
              </h1>
              {hero.text && (
                <p className="mt-5 max-w-[560px] text-[17px] leading-[var(--leading-relaxed)] text-[hsl(45_30%_96%_/_0.85)]">
                  {hero.text}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3.5">
                {hero.primary.label && hero.primary.href && (
                  <Button href={hero.primary.href} size="lg">
                    {hero.primary.label}
                  </Button>
                )}
                {hero.secondary.label && hero.secondary.href && (
                  <Button href={hero.secondary.href} size="lg" variant="secondary">
                    {hero.secondary.label}
                  </Button>
                )}
              </div>
            </Container>
          </section>
        )}

        {/* COMMENT CA MARCHE */}
        {steps.show && (
          <Container as="section" className="py-24">
            <h2 className="max-w-[640px] font-display text-[var(--text-display-m)]">
              {steps.title}
            </h2>
            {steps.subtitle && (
              <p className="mt-3 max-w-[560px] text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                {steps.subtitle}
              </p>
            )}
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.items.map((step, i) => (
                <div key={i}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-m)] bg-[var(--rose-100)] font-display text-[18px] text-green-900">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-5 text-[18px] font-bold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        )}

        {/* PORTRAIT DE PRODUCTEUR */}
        {portrait && (
          <section className="bg-[var(--surface-sunken)] py-24">
            <Container>
              <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    {home.portrait.kicker}
                  </div>
                  <h2 className="mt-2 font-display text-[var(--text-display-m)]">
                    {home.portrait.title}
                  </h2>
                </div>
                <Link href="/producteurs" className="mp-nav-link whitespace-nowrap">
                  Tous les producteurs →
                </Link>
              </div>
              <div className="grid overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-card)] shadow-[var(--shadow-l)] lg:grid-cols-[1.1fr_1fr]">
                <div className="relative min-h-[420px] bg-[linear-gradient(120deg,var(--green-900),var(--green-700))]">
                  {portraitImage && (
                    <Image
                      src={portraitImage}
                      alt={portrait.farmName}
                      fill
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <Badge tone="brand" className="self-start">
                    Producteur vérifié
                  </Badge>
                  <h3 className="mt-4 font-display text-[34px] text-[var(--text-primary)]">
                    {portrait.farmName}
                  </h3>
                  <div className="mt-1 text-[14px] text-[var(--text-muted)]">
                    {[
                      portrait.productionType,
                      [portrait.city, portrait.region].filter(Boolean).join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {portraitText && (
                    <p className="mt-5 whitespace-pre-line text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                      {portraitText}
                    </p>
                  )}
                  {portraitStats.length > 0 && (
                    <div className="mt-7 flex gap-7">
                      {portraitStats.map(([value, label]) => (
                        <div key={label}>
                          <div className="font-display text-[22px] text-green-900">{value}</div>
                          <div className="text-[12px] text-[var(--text-muted)]">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-8">
                    <Button href={`/producteurs/${portrait.slug}`} variant="secondary">
                      Découvrir {portrait.farmName}
                    </Button>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* LE RESEAU */}
        {network.show && (
          <Container as="section" className="py-24">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              {network.kicker}
            </div>
            <h2 className="mt-2 max-w-[680px] font-display text-[var(--text-display-m)] text-green-900">
              {network.title}
            </h2>
            {network.text && (
              <p className="mt-3 max-w-[600px] text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                {network.text}
              </p>
            )}

            <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
              {/* Recommandations */}
              <div>
                <div className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Recommandations depuis le profil
                </div>
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
                  <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 font-display text-[14px] text-sand-50">
                      BS
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-[var(--text-primary)]">
                        La Brasserie Sagesse
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">
                        recommande 3 producteurs
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3.5 pt-4">
                    {[
                      ["FD", "Fromagerie Dubois", "« Leur comté tient une carte à lui seul. »"],
                      ["CD", "Cidrerie Desfriennes", "« On partage le camion depuis 2021. »"],
                    ].map(([initials, name, quote]) => (
                      <div
                        key={name}
                        className="flex items-center gap-3 rounded-[var(--radius-m)] border border-[var(--border-subtle)] p-3"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-200 font-display text-[12px] text-green-900">
                          {initials}
                        </span>
                        <div>
                          <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                            {name}
                          </div>
                          <div className="text-[12px] text-[var(--text-muted)]">{quote}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* La tournée mutualisée */}
              <div>
                <div className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  La tournée mutualisée
                </div>
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
                  <div className="flex items-center justify-between">
                    {["La Sagesse", "Dubois", "Desfriennes"].map((name, i) => (
                      <div key={name} className="flex flex-1 flex-col items-center gap-2">
                        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--rose-100)] font-display text-[13px] text-green-900">
                          {i + 1}
                        </span>
                        <span className="text-center text-[12px] font-semibold text-[var(--text-primary)]">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="my-4 text-center text-[var(--sand-400)]">↓</div>
                  <div className="flex items-center gap-3.5 rounded-[var(--radius-m)] bg-[var(--accent-secondary-hover)] px-5 py-4">
                    <span className="text-[22px]">🚚</span>
                    <div>
                      <div className="text-[14px] font-bold text-white">
                        Une tournée, mardi matin
                      </div>
                      <div className="text-[12px] text-[hsl(45_30%_96%_/_0.75)]">
                        3 producteurs, 1 livraison, votre cuisine
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        )}

        {/* CATALOGUE TEASER */}
        {catalogue && catalogue.products.length > 0 && (
          <section className="bg-[var(--surface-sunken)] py-24">
            <Container>
              <div className="mb-9 flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    {home.catalogue.kicker}
                  </div>
                  <h2 className="mt-2 font-display text-[var(--text-display-m)]">
                    {home.catalogue.title
                      .replace("{produits}", plural(catalogue.productCount, "produit", "produits"))
                      .replace(
                        "{producteurs}",
                        plural(catalogue.producerCount, "producteur", "producteurs"),
                      )}
                  </h2>
                </div>
                <Link href="/catalogue" className="mp-nav-link whitespace-nowrap">
                  Voir tout le catalogue →
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {catalogue.products.map((p) => (
                  <Card
                    key={p.id}
                    image={p.photoUrl ?? undefined}
                    imageAlt={p.name}
                    eyebrow={p.producer.region || undefined}
                    title={p.name}
                    subtitle={p.producer.farmName}
                    href={`/catalogue/${p.slug}`}
                  />
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* MANIFESTE */}
        {manifesto.show && (
          <section className="bg-green-900 px-[var(--container-pad)] py-28 text-center">
            <div className="mx-auto max-w-[760px]">
              <p className="font-display text-[clamp(26px,3vw,38px)] leading-[var(--leading-snug)] text-white">
                {manifesto.quote}
              </p>
              {manifesto.signature && (
                <div className="mt-6 text-[15px] text-[var(--rose-100)]">{manifesto.signature}</div>
              )}
            </div>
          </section>
        )}

        {/* BLOG / PODCAST */}
        {home.content.show && (
          <Container as="section" className="py-24">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="text-[18px]">📖</span>
                  <h2 className="font-display text-[20px]">{home.content.blogTitle}</h2>
                </div>
                <div className="flex flex-col">
                  {articles.length === 0 && (
                    <p className="py-[18px] text-[14px] text-[var(--text-muted)]">
                      Les premiers articles arrivent bientôt.
                    </p>
                  )}
                  {articles.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/blog/${a.slug}`}
                      className="group border-b border-[var(--border-subtle)] py-[18px]"
                    >
                      <div className="text-[15px] font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--text-brand)]">
                        {a.title}
                      </div>
                      <div className="mt-1.5 text-[12px] text-[var(--text-muted)]">{a.meta}</div>
                    </Link>
                  ))}
                  {articles.length > 0 && (
                    <Link
                      href="/blog"
                      className="pt-4 text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
                    >
                      Tous les articles →
                    </Link>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="text-[18px]">🎧</span>
                  <h2 className="font-display text-[20px]">{home.content.podcastTitle}</h2>
                </div>
                {episode ? (
                  <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
                    <Badge tone="secondary">Épisode {episode.num}</Badge>
                    <h3 className="mt-3 font-display text-[20px] text-[var(--text-primary)]">
                      {episode.title}
                    </h3>
                    {episode.excerpt && (
                      <p className="mt-2 text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                        {episode.excerpt}
                      </p>
                    )}
                    <div className="mt-4">
                      <Button
                        href={`/podcast?episode=${encodeURIComponent(episode.slug)}#episodes`}
                        variant="outline"
                        size="sm"
                      >
                        Écouter l&apos;épisode
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-m)]">
                    Le premier épisode arrive bientôt.
                  </div>
                )}
              </div>
            </div>
          </Container>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

/** Producteur à la une : celui choisi dans l'admin, sinon un producteur actif avec photo. */
async function getPortrait(producerId: string) {
  const select = {
    slug: true,
    farmName: true,
    tagline: true,
    description: true,
    productionType: true,
    city: true,
    region: true,
    coverUrl: true,
    foundedYear: true,
    _count: {
      select: {
        products: { where: { isActive: true } },
        connectionsFrom: true,
      },
    },
  } as const;
  const active = { user: { status: "ACTIVE" as const } };
  return withRetry(
    async () =>
      (producerId
        ? await prisma.producerProfile.findFirst({
            where: { id: producerId, ...active },
            select,
          })
        : null) ??
      (await prisma.producerProfile.findFirst({
        where: { ...active, coverUrl: { not: null } },
        orderBy: { updatedAt: "desc" },
        select,
      })),
  ).catch(() => null);
}

/** Aperçu du catalogue : vrais chiffres + produits choisis (ou les derniers avec photo). */
async function getCatalogueTeaser(productIds: string[]) {
  const visible = {
    isActive: true,
    producer: { user: { status: "ACTIVE" as const } },
  };
  const select = {
    id: true,
    slug: true,
    name: true,
    photoUrl: true,
    producer: { select: { farmName: true, region: true } },
  } as const;
  return withRetry(async () => {
    const [productCount, producerCount, chosen] = await Promise.all([
      prisma.product.count({ where: visible }),
      prisma.producerProfile.count({
        where: {
          user: { status: "ACTIVE" },
          products: { some: { isActive: true } },
        },
      }),
      productIds.length
        ? prisma.product.findMany({
            where: { id: { in: productIds }, ...visible },
            select,
          })
        : Promise.resolve([]),
    ]);
    // Garder l'ordre choisi dans l'admin.
    let products = productIds
      .map((id) => chosen.find((p) => p.id === id))
      .filter((p): p is (typeof chosen)[number] => !!p);
    if (!products.length) {
      products = await prisma.product.findMany({
        where: { ...visible, photoUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 4,
        select,
      });
    }
    return { productCount, producerCount, products };
  }).catch(() => null);
}
