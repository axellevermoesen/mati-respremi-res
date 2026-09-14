import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductPurchase } from "./ProductPurchase";

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

async function getProduct(slug: string) {
  return withRetry(() =>
    prisma.product.findFirst({
      where: { slug, producer: { user: { status: "ACTIVE" } } },
      select: {
        id: true,
        slug: true,
        name: true,
        detail: true,
        formats: true,
        description: true,
        category: true,
        unit: true,
        basePrice: true,
        vatRate: true,
        photoUrl: true,
        isActive: true,
        producer: {
          select: {
            slug: true,
            farmName: true,
            region: true,
            city: true,
            certifsList: true,
            minOrderValue: true,
            freeShippingFrom: true,
            leadTimeDays: true,
            deliveryDays: true,
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
  const p = await getProduct(slug);
  if (!p) return { title: "Produit introuvable" };
  return {
    title: `${p.name} — ${p.producer.farmName}`,
    description: p.description ?? p.detail ?? undefined,
  };
}

export default async function FicheProduitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p || !p.isActive) notFound();

  const session = await auth();
  const isBuyer =
    session?.user?.role === "RESTAURANT" || session?.user?.role === "RESELLER";

  const ht = Number(p.basePrice);
  const vat = Number(p.vatRate);
  const ttc = ht * (1 + vat / 100);
  const certifs =
    (p.producer.certifsList as { nom: string; annee?: string }[] | null) ?? [];
  const prodLoc = [p.producer.city, p.producer.region].filter(Boolean).join(", ");

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-24">
        {/* Fil d'ariane */}
        <div className="flex items-center gap-2 pb-1 pt-5 text-[13px] text-[var(--text-muted)]">
          <Link href="/catalogue" className="hover:underline">
            Catalogue
          </Link>
          <span>/</span>
          <Link
            href={`/catalogue?categorie=${encodeURIComponent(p.category)}`}
            className="hover:underline"
          >
            {p.category}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">{p.name}</span>
        </div>

        <div className="grid gap-8 py-6 lg:grid-cols-2 lg:items-start">
          {/* Photo */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-sunken)]">
            {p.photoUrl ? (
              <Image
                src={p.photoUrl}
                alt={p.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">
                Pas encore de photo
              </div>
            )}
            {certifs[0] && (
              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-[var(--radius-pill)] bg-green-900 px-3 py-1.5 text-[12px] font-bold text-[var(--text-inverse)]">
                  {certifs[0].nom}
                </span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-900 font-display text-[14px] text-[var(--text-inverse)]">
                {p.producer.farmName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/producteurs/${p.producer.slug}`}
                  className="text-[14px] font-bold text-[var(--text-brand)] hover:underline"
                >
                  {p.producer.farmName}
                </Link>
                {prodLoc && (
                  <div className="text-[12px] text-[var(--text-muted)]">{prodLoc}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <h1 className="font-display text-[34px] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-green-900">
                {p.name}
              </h1>
              {(p.description || p.detail) && (
                <p className="text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                  {p.description || p.detail}
                </p>
              )}
            </div>

            {certifs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certifs.map((c, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-[var(--radius-s)] bg-[var(--surface-card)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                  >
                    <span className="text-green-700">✓</span>
                    {c.nom}
                  </span>
                ))}
              </div>
            )}

            {/* Prix */}
            <div className="flex flex-col gap-1 pt-1">
              <span className="font-display text-[32px] leading-none text-[var(--text-primary)]">
                {eur(ht)}{" "}
                <span className="text-[15px] text-[var(--text-muted)]">HT</span>
              </span>
              <span className="text-[13px] text-[var(--text-muted)]">
                TVA {vat.toLocaleString("fr-FR")} % · soit {eur(ttc)} TTC
              </span>
              {!isBuyer && (
                <span className="mt-1 text-[13px] text-[var(--text-secondary)]">
                  Les tarifs et la commande sont réservés aux comptes pro.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-[14px] text-[var(--text-secondary)]">
              <span>
                <strong className="text-[var(--text-primary)]">Conditionnement</strong> — vendu par{" "}
                {p.unit}
                {p.formats ? ` · aussi : ${p.formats}` : ""}
              </span>
            </div>

            <ProductPurchase productId={p.id} unitPrice={ht} canOrder={isBuyer} />

            {/* Conditions producteur */}
            <div className="grid gap-3 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)] sm:grid-cols-2">
              {p.producer.minOrderValue != null && (
                <Info label="Minimum de commande" value={`${eur(Number(p.producer.minOrderValue))} HT`} />
              )}
              {p.producer.freeShippingFrom != null && (
                <Info
                  label="Franco de port"
                  value={`à partir de ${eur(Number(p.producer.freeShippingFrom))} HT`}
                />
              )}
              <Info label="Préavis producteur" value={`${p.producer.leadTimeDays} jours`} />
              {p.producer.deliveryDays && (
                <Info label="Jours de tournée" value={p.producer.deliveryDays} />
              )}
              <Info label="Référence" value={p.slug.toUpperCase()} />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
