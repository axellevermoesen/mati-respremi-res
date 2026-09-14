import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fmtMoney, type SaleFormat } from "@/lib/formats";

type Audience = "pro" | "pub";

/** Prix d'un format pour la page publique, selon l'audience et le réglage du producteur. */
function priceForFormat(
  f: { pricePro?: number | null; priceRetail?: number | null },
  audience: Audience,
  mode: string,
): string | null {
  const pro = f.pricePro != null ? `${fmtMoney(Number(f.pricePro))} € HT` : null;
  if (audience === "pro") return pro;
  if (mode === "none") return null;
  if (mode === "pro") return pro;
  return f.priceRetail != null ? `~ ${fmtMoney(Number(f.priceRetail))} €` : null;
}
type Vis = Record<string, { pro?: boolean; pub?: boolean }> | null;
type Jsonish<T> = T[] | null;

const LEGAL_LABELS: Record<string, string> = {
  EI: "Exploitation individuelle",
  EARL: "EARL",
  GAEC: "GAEC",
  SCEA: "SCEA",
  SARL: "SARL",
  SAS: "SAS",
  SCOP: "SCOP",
  ASSO: "Association",
};
const MODE_LABELS: Record<string, string> = {
  bio: "Bio certifié",
  conversion: "En conversion bio",
  raisonnee: "Agriculture raisonnée",
  biodynamie: "Biodynamie",
  conventionnel: "Conventionnel",
};
const SEASON_LABELS: Record<string, string> = {
  annee: "Toute l'année",
  saison: "Saisonnière",
  creux: "Toute l'année, avec un creux hivernal",
};

async function getProfile(slug: string) {
  return withRetry(() =>
    prisma.producerProfile.findFirst({
      where: { slug, user: { status: "ACTIVE" } },
      select: {
        userId: true,
        slug: true,
        farmName: true,
        coverUrl: true,
        logoUrl: true,
        mediaUrls: true,
        tagline: true,
        description: true,
        region: true,
        city: true,
        productionType: true,
        values: true,
        certifsList: true,
        foundedYear: true,
        legalForm: true,
        headcount: true,
        capacity: true,
        capacityUnit: true,
        farmArea: true,
        productionMode: true,
        seasonality: true,
        contacts: true,
        mapAddress: true,
        directMarkets: true,
        farmShopHours: true,
        farmShopVisit: true,
        farmShopAddress: true,
        resellers: true,
        amaps: true,
        otherResellersMention: true,
        clients: true,
        network: true,
        minOrderValue: true,
        freeShippingFrom: true,
        leadTimeDays: true,
        deliveryRadius: true,
        deliveryDays: true,
        sectionVisibility: true,
        publicPriceMode: true,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: {
            slug: true,
            name: true,
            detail: true,
            formats: true,
            basePrice: true,
            retailPrice: true,
            salesFormats: true,
            description: true,
            photoUrl: true,
          },
        },
      },
    }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfile(slug);
  if (!p) return { title: "Producteur introuvable" };
  return { title: p.farmName, description: p.tagline ?? undefined };
}

/* ------------------------------------------------------------------ */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
      {children}
    </div>
  );
}

function Initials({ name, tone = "green" }: { name: string; tone?: "green" | "rose" }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[13px] text-white ${
        tone === "rose" ? "bg-rose-600" : "bg-green-700"
      }`}
    >
      {letters}
    </span>
  );
}

/* ------------------------------------------------------------------ */

export default async function ProducteurPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apercu?: string }>;
}) {
  const { slug } = await params;
  const { apercu } = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const session = await auth();
  const isBuyer =
    session?.user?.role === "RESTAURANT" || session?.user?.role === "RESELLER";
  const isOwner = session?.user?.id === profile.userId;

  let audience: Audience = isBuyer ? "pro" : "pub";
  if (isOwner) audience = apercu === "pro" ? "pro" : "pub";

  const vis = profile.sectionVisibility as Vis;
  const show = (key: string) => vis?.[key]?.[audience] ?? true;

  const values = profile.values
    ? profile.values.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const certifs =
    (profile.certifsList as Jsonish<{ nom: string; annee?: string }>) ?? [];
  const contacts = (
    (profile.contacts as Jsonish<{
      label: string;
      value: string;
      pro?: boolean;
      pub?: boolean;
    }>) ?? []
  ).filter((c) => c.value && (audience === "pro" ? c.pro : c.pub));
  const markets =
    (profile.directMarkets as Jsonish<{ nom: string; jour: string; lieu: string }>) ?? [];
  const resellers =
    (profile.resellers as Jsonish<{ nom: string; type: string; ville: string }>) ?? [];
  const amaps = (profile.amaps as Jsonish<{ nom: string; detail: string }>) ?? [];
  const clients =
    (profile.clients as Jsonish<{ nom: string; role: string; produit: string }>) ?? [];
  const network =
    (profile.network as Jsonish<{ nom: string; role: string; groupe: string; mot?: string }>) ?? [];
  const partenaires = network.filter((n) => n.groupe === "partenaire");
  const recommandes = network.filter((n) => n.groupe === "recommande");

  const media = (
    Array.isArray(profile.mediaUrls) ? (profile.mediaUrls as string[]) : []
  ).filter(Boolean);
  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const storyParas = (profile.description ?? "").split(/\n{2,}/).filter(Boolean);
  const hasFarmShop =
    profile.farmShopHours || profile.farmShopVisit || profile.farmShopAddress;

  const infos: { label: string; value: string }[] = [
    profile.legalForm && {
      label: "Forme juridique",
      value: LEGAL_LABELS[profile.legalForm] ?? profile.legalForm,
    },
    profile.foundedYear && { label: "Année de création", value: String(profile.foundedYear) },
    profile.headcount && { label: "Effectif", value: `${profile.headcount} personnes` },
    profile.capacity && {
      label: "Capacité de production",
      value: [profile.capacity, profile.capacityUnit].filter(Boolean).join(" "),
    },
    profile.farmArea && { label: "Surface (SAU)", value: `${profile.farmArea} ha` },
    profile.productionMode && {
      label: "Mode de production",
      value: MODE_LABELS[profile.productionMode] ?? profile.productionMode,
    },
    profile.seasonality && {
      label: "Saisonnalité",
      value: SEASON_LABELS[profile.seasonality] ?? profile.seasonality,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const stats = [
    profile.foundedYear && { value: String(profile.foundedYear), label: "Fondée en" },
    profile.products.length > 0 && {
      value: String(profile.products.length),
      label: profile.products.length > 1 ? "Produits au catalogue" : "Produit au catalogue",
    },
    profile.productionMode
      ? { value: MODE_LABELS[profile.productionMode] ?? profile.productionMode, label: "Production" }
      : profile.region && { value: profile.region, label: "Région" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <>
      <SiteHeader />

      <main className="bg-[var(--surface-page)] pb-20">
        {isOwner && (
          <div className="border-b border-[var(--border-subtle)] bg-[var(--rose-100)] px-[var(--container-pad)] py-2.5 text-center text-[13px] text-green-900">
            Aperçu de votre page —{" "}
            <Link
              href={`/producteurs/${profile.slug}?apercu=pub`}
              className={`font-semibold ${audience === "pub" ? "underline" : "hover:underline"}`}
            >
              vue particuliers
            </Link>{" "}
            ·{" "}
            <Link
              href={`/producteurs/${profile.slug}?apercu=pro`}
              className={`font-semibold ${audience === "pro" ? "underline" : "hover:underline"}`}
            >
              vue revendeurs
            </Link>{" "}
            · <Link href="/compte/ma-page" className="font-semibold hover:underline">modifier</Link>
          </div>
        )}

        <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)]">
          {/* HERO */}
          <div className="relative mt-6">
            <div className="relative h-[260px] overflow-hidden rounded-[var(--radius-l)] bg-[linear-gradient(120deg,var(--green-900),var(--green-700))] sm:h-[320px]">
              {profile.coverUrl && (
                <Image
                  src={profile.coverUrl}
                  alt={`${profile.farmName} — couverture`}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="absolute -bottom-[52px] left-6 flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-full border-[5px] border-[var(--surface-page)] bg-green-700 font-display text-[32px] text-white shadow-[var(--shadow-m)]">
              {profile.logoUrl ? (
                <Image
                  src={profile.logoUrl}
                  alt={`${profile.farmName} — logo`}
                  fill
                  sizes="116px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                profile.farmName.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <div className="mt-[72px] flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone="brand">Producteur vérifié</Badge>
                {profile.region && <Badge tone="neutral">{profile.region}</Badge>}
                {profile.productionType && <Badge tone="neutral">{profile.productionType}</Badge>}
                {certifs[0] && <Badge tone="success">{certifs[0].nom}</Badge>}
              </div>
              <h1 className="font-display text-[var(--text-display-l)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-[var(--text-primary)]">
                {profile.farmName}
              </h1>
              {profile.tagline && (
                <p className="mt-4 max-w-[600px] text-[var(--text-body-l)] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                  {profile.tagline}
                </p>
              )}
            </div>
            <div className="flex gap-3 pb-1.5">
              {markets.length > 0 || hasFarmShop ? (
                <Button href="#en-direct" variant="secondary">
                  Où les trouver
                </Button>
              ) : null}
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]"
                >
                  <div className="font-display text-[30px] leading-none text-green-900">
                    {s.value}
                  </div>
                  <div className="mt-2.5 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CORPS */}
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* --- Colonne principale --- */}
            <div className="flex flex-col gap-10">
              {show("histoire") && storyParas.length > 0 && (
                <section>
                  <Kicker>L&apos;histoire</Kicker>
                  {storyParas.map((p, i) => (
                    <p
                      key={i}
                      className="mt-4 text-[var(--text-body-l)] leading-[var(--leading-relaxed)] text-[var(--text-secondary)] first:mt-0"
                    >
                      {p}
                    </p>
                  ))}
                </section>
              )}

              {show("valeurs") && values.length > 0 && (
                <section>
                  <Kicker>Valeurs</Kicker>
                  <div className="flex flex-wrap gap-2.5">
                    {values.map((v) => (
                      <span
                        key={v}
                        className="rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-primary)]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {show("produits") && profile.products.length > 0 && (
                <section>
                  <Kicker>Aperçu des produits</Kicker>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {profile.products.map((p) => (
                      <div
                        key={p.slug}
                        className="flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)]"
                      >
                        <div className="relative h-[140px] bg-[var(--surface-sunken)]">
                          {p.photoUrl && (
                            <Image
                              src={p.photoUrl}
                              alt={p.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 300px"
                              className="object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5 p-4">
                          <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                            {p.name}
                          </div>
                          {p.detail && (
                            <div className="text-[12px] text-[var(--text-muted)]">{p.detail}</div>
                          )}
                          {(() => {
                            const sf: SaleFormat[] = Array.isArray(p.salesFormats)
                              ? (p.salesFormats as unknown as SaleFormat[])
                              : [];
                            const mode = profile.publicPriceMode;

                            if (sf.length >= 2) {
                              return (
                                <div className="mt-auto flex flex-col gap-1 pt-2.5">
                                  {sf.map((f, i) => {
                                    const pr = priceForFormat(f, audience, mode);
                                    return (
                                      <div
                                        key={i}
                                        className="flex items-baseline justify-between gap-2 border-t border-[var(--border-subtle)] pt-1 text-[12px] first:border-0 first:pt-0"
                                      >
                                        <span className="text-[var(--text-secondary)]">{f.label}</span>
                                        {pr && (
                                          <span className="shrink-0 font-display text-[12px] text-green-900">
                                            {pr}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            const single = priceForFormat(
                              {
                                pricePro: p.basePrice != null ? Number(p.basePrice) : null,
                                priceRetail: p.retailPrice != null ? Number(p.retailPrice) : null,
                              },
                              audience,
                              mode,
                            );
                            return (
                              <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                                {p.formats && (
                                  <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-green-900">
                                    {p.formats}
                                  </span>
                                )}
                                {single && (
                                  <span className="font-display text-[13px] text-green-900">
                                    {single}
                                    {audience !== "pro" && mode === "retail" && (
                                      <span className="font-body text-[11px] font-normal text-[var(--text-muted)]">
                                        {" "}
                                        conseillé
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {show("direct") && (markets.length > 0 || hasFarmShop) && (
                <section id="en-direct" className="rounded-[var(--radius-l)] bg-[var(--rose-100)] p-6">
                  <Kicker>Acheter mes produits en direct</Kicker>
                  <p className="mb-5 text-[14px] text-[var(--text-secondary)]">
                    Sur les marchés, ou à la ferme. Sans intermédiaire.
                  </p>
                  {markets.length > 0 && (
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-green-700" />
                        <span className="font-display text-[var(--text-heading-s)] text-green-900">
                          Sur les marchés
                        </span>
                      </div>
                      <div className="mb-6 grid gap-2.5 sm:grid-cols-2">
                        {markets.map((m, i) => (
                          <div
                            key={i}
                            className="rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                          >
                            <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                              {m.nom}
                            </div>
                            {m.jour && (
                              <div className="mt-2 font-display text-[12px] text-green-900">
                                {m.jour}
                              </div>
                            )}
                            {m.lieu && (
                              <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                                {m.lieu}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {hasFarmShop && (
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        <span className="font-display text-[var(--text-heading-s)] text-green-900">
                          Vente à la ferme
                        </span>
                      </div>
                      <div className="grid gap-5 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)] sm:grid-cols-3">
                        {[
                          ["Ouverture", profile.farmShopHours],
                          ["Visite & dégustation", profile.farmShopVisit],
                          ["Adresse", profile.farmShopAddress],
                        ]
                          .filter(([, v]) => v)
                          .map(([label, value]) => (
                            <div key={label}>
                              <div className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                                {label}
                              </div>
                              <div className="mt-1.5 text-[14px] font-semibold text-[var(--text-primary)]">
                                {value}
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </section>
              )}

              {show("ouTrouver") &&
                (resellers.length > 0 || amaps.length > 0 || profile.otherResellersMention) && (
                  <section>
                    <Kicker>Où trouver mes produits</Kicker>
                    {resellers.length > 0 && (
                      <>
                        <div className="mb-3 font-display text-[var(--text-heading-s)] text-green-900">
                          Revendeurs
                        </div>
                        <div className="mb-6 flex flex-col gap-2">
                          {resellers.map((r, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] border border-[var(--border-subtle)] px-5 py-4"
                            >
                              <div className="min-w-0">
                                <div className="text-[15px] font-bold text-[var(--text-primary)]">
                                  {r.nom}
                                </div>
                                {r.type && (
                                  <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                                    {r.type}
                                  </div>
                                )}
                              </div>
                              {r.ville && (
                                <div className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                                  {r.ville}
                                </div>
                              )}
                            </div>
                          ))}
                          {profile.otherResellersMention && (
                            <div className="px-5 py-2 text-[13px] italic text-[var(--text-muted)]">
                              … et d&apos;autres revendeurs près de chez vous.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {amaps.length > 0 && (
                      <>
                        <div className="mb-3 font-display text-[var(--text-heading-s)] text-green-900">
                          AMAP partenaires
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {amaps.map((a, i) => (
                            <div
                              key={i}
                              className="rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                            >
                              <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                                {a.nom}
                              </div>
                              {a.detail && (
                                <div className="mt-1.5 text-[12px] text-[var(--text-muted)]">
                                  {a.detail}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}

              {show("clients") && clients.length > 0 && (
                <section>
                  <Kicker>Ils utilisent mes produits</Kicker>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {clients.map((c, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-3 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                      >
                        <div className="flex items-center gap-3">
                          <Initials name={c.nom} />
                          <div className="min-w-0">
                            <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                              {c.nom}
                            </div>
                            {c.role && (
                              <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                                {c.role}
                              </div>
                            )}
                          </div>
                        </div>
                        {c.produit && (
                          <div className="text-[14px] leading-normal text-[var(--text-secondary)]">
                            {c.produit}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {show("certifications") && certifs.length > 0 && (
                <section>
                  <Kicker>Certifications</Kicker>
                  <div className="flex flex-col gap-2">
                    {certifs.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] bg-[var(--surface-card)] px-5 py-4 shadow-[var(--shadow-s)]"
                      >
                        <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                          {c.nom}
                        </div>
                        {c.annee && (
                          <div className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                            Depuis {c.annee}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {show("infos") && infos.length > 0 && (
                <section>
                  <Kicker>Infos complémentaires</Kicker>
                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {infos.map((i) => (
                      <div key={i.label} className="border-t border-[var(--border-subtle)] pt-3">
                        <div className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                          {i.label}
                        </div>
                        <div className="mt-1.5 font-display text-[var(--text-heading-s)] text-green-900">
                          {i.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {show("medias") && media.length > 0 && (
                <section>
                  <Kicker>En images</Kicker>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {media.map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]"
                      >
                        <Image
                          src={src}
                          alt={`${profile.farmName} — photo ${i + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 300px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {show("reseau") && (partenaires.length > 0 || recommandes.length > 0) && (
                <section className="rounded-[var(--radius-l)] bg-[var(--surface-sunken)] p-6">
                  <Kicker>Mon réseau</Kicker>
                  <p className="mb-5 text-[14px] text-[var(--text-secondary)]">
                    Les producteurs voisins avec qui ça matche.
                  </p>
                  {partenaires.length > 0 && (
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-green-700" />
                        <span className="font-display text-[var(--text-heading-s)] text-green-900">
                          Je travaille avec eux
                        </span>
                      </div>
                      <div className="mb-6 grid gap-2.5 sm:grid-cols-2">
                        {partenaires.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                          >
                            <Initials name={r.nom} />
                            <div className="min-w-0">
                              <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                                {r.nom}
                              </div>
                              {r.role && (
                                <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                                  {r.role}
                                </div>
                              )}
                              {r.mot && (
                                <p className="mt-1.5 text-[13px] italic leading-normal text-[var(--text-secondary)]">
                                  «&nbsp;{r.mot}&nbsp;»
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {recommandes.length > 0 && (
                    <>
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-rose-600" />
                        <span className="font-display text-[var(--text-heading-s)] text-green-900">
                          Je recommande leur produit
                        </span>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {recommandes.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                          >
                            <Initials name={r.nom} tone="rose" />
                            <div className="min-w-0">
                              <div className="text-[15px] font-bold leading-tight text-[var(--text-primary)]">
                                {r.nom}
                              </div>
                              {r.role && (
                                <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                                  {r.role}
                                </div>
                              )}
                              {r.mot && (
                                <p className="mt-1.5 text-[13px] italic leading-normal text-[var(--text-secondary)]">
                                  «&nbsp;{r.mot}&nbsp;»
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              )}
            </div>

            {/* --- Colonne latérale --- */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
              {audience === "pub" && (
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-inverse)] p-5">
                  <div className="font-display text-[var(--text-heading-m)] leading-[var(--leading-snug)] text-white">
                    Restaurant ou revendeur ?
                  </div>
                  <p className="mb-4 mt-2 text-[14px] leading-normal text-[hsl(45_30%_96%_/_0.8)]">
                    Connectez-vous pour travailler avec ce producteur : tarifs pro, volumes et
                    livraisons mutualisées.
                  </p>
                  <Button
                    href="/connexion?role=acheteur"
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    Se connecter
                  </Button>
                  <div className="mt-3 text-center text-[12px] text-[hsl(45_30%_96%_/_0.65)]">
                    Pas encore de compte pro ?{" "}
                    <Link href="/inscription/acheteur" className="text-white underline">
                      Créer un compte
                    </Link>
                  </div>
                </div>
              )}

              {audience === "pro" && (
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-inverse)] p-5 text-white">
                  <div className="font-display text-[var(--text-heading-m)] leading-[var(--leading-snug)]">
                    Conditions pro
                  </div>
                  <div className="mt-3 flex flex-col gap-2.5 text-[14px]">
                    {profile.minOrderValue != null && (
                      <div className="flex justify-between gap-3">
                        <span className="text-[hsl(45_30%_96%_/_0.75)]">Commande minimum</span>
                        <span className="font-semibold">{String(profile.minOrderValue)} € HT</span>
                      </div>
                    )}
                    {profile.freeShippingFrom != null && (
                      <div className="flex justify-between gap-3">
                        <span className="text-[hsl(45_30%_96%_/_0.75)]">Franco de port</span>
                        <span className="font-semibold">
                          {String(profile.freeShippingFrom)} € HT
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <span className="text-[hsl(45_30%_96%_/_0.75)]">Délai de préparation</span>
                      <span className="font-semibold">{profile.leadTimeDays} j</span>
                    </div>
                    {profile.deliveryDays && (
                      <div className="flex justify-between gap-3">
                        <span className="text-[hsl(45_30%_96%_/_0.75)]">Tournées</span>
                        <span className="font-semibold">{profile.deliveryDays}</span>
                      </div>
                    )}
                    {profile.deliveryRadius && (
                      <div className="flex justify-between gap-3">
                        <span className="text-[hsl(45_30%_96%_/_0.75)]">Rayon de livraison</span>
                        <span className="font-semibold">{profile.deliveryRadius} km</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {contacts.length > 0 && (
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]">
                  <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    Contact
                  </div>
                  <div className="flex flex-col gap-3">
                    {contacts.map((c) => (
                      <div key={c.label} className="flex flex-col gap-0.5">
                        <div className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                          {c.label}
                        </div>
                        <div className="break-words text-[14px] font-semibold text-[var(--text-primary)]">
                          {c.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.mapAddress && (
                <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]">
                  <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    Localisation
                  </div>
                  <div className="relative h-[160px] overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]">
                    <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-rose-600 shadow-[var(--shadow-s)]" />
                  </div>
                  <div className="mt-3 text-[14px] leading-normal text-[var(--text-secondary)]">
                    {profile.mapAddress}
                  </div>
                </div>
              )}

              {(location || profile.productionType) && (
                <div className="rounded-[var(--radius-l)] bg-[var(--rose-100)] p-4">
                  <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-green-900">
                    En un coup d&apos;œil
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      profile.city && ["Ville", profile.city],
                      profile.productionType && ["Production", profile.productionType],
                      certifs[0] && ["Label", certifs[0].nom],
                      markets.length > 0 && ["Marchés", `${markets.length}`],
                    ]
                      .filter(Boolean)
                      .map((row) => {
                        const [label, value] = row as [string, string];
                        return (
                          <div key={label} className="flex justify-between gap-4 text-[14px]">
                            <span className="text-[var(--text-secondary)]">{label}</span>
                            <span className="text-right font-bold text-green-900">{value}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
