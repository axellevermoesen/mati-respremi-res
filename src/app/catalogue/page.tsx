import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Tous les produits des producteurs de Matières Premières.",
};

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

type SP = { q?: string; categorie?: string; producteur?: string };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categorie = sp.categorie ?? "";
  const producteur = sp.producteur ?? "";

  const where = {
    isActive: true,
    ...(categorie ? { category: categorie } : {}),
    ...(producteur ? { producer: { slug: producteur } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { detail: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { producer: { farmName: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [products, byCategory, producers, total] = await withRetry(() =>
    Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          slug: true,
          name: true,
          photoUrl: true,
          basePrice: true,
          unit: true,
          detail: true,
          category: true,
          producer: { select: { farmName: true, slug: true } },
        },
      }),
      prisma.product.groupBy({
        by: ["category"],
        where: { isActive: true },
        _count: { _all: true },
        orderBy: { category: "asc" },
      }),
      prisma.producerProfile.findMany({
        where: { products: { some: { isActive: true } } },
        orderBy: { farmName: "asc" },
        select: { slug: true, farmName: true, _count: { select: { products: true } } },
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]),
  );

  const qs = (patch: Partial<SP>) => {
    const next = new URLSearchParams();
    const merged = { q, categorie, producteur, ...patch };
    if (merged.q) next.set("q", merged.q);
    if (merged.categorie) next.set("categorie", merged.categorie);
    if (merged.producteur) next.set("producteur", merged.producteur);
    const s = next.toString();
    return s ? `/catalogue?${s}` : "/catalogue";
  };

  const hasFilters = Boolean(q || categorie || producteur);

  return (
    <>
      <SiteHeader />

      {/* Sous-en-tête : recherche + compteur */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-page)]">
        <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-wrap items-center gap-4 px-[var(--container-pad)] py-4">
          <form action="/catalogue" className="relative max-w-[440px] flex-1">
            {categorie && <input type="hidden" name="categorie" value={categorie} />}
            {producteur && <input type="hidden" name="producteur" value={producteur} />}
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher un produit, une région, un producteur"
              className="w-full rounded-[var(--radius-pill)] bg-[var(--surface-card)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[inset_0_0_0_1px_var(--border-focus)]"
            />
          </form>
          <div className="ml-auto text-[13px] text-[var(--text-muted)]">
            {q || categorie || producteur
              ? `${products.length} sur ${total} produits`
              : `${total} produits`}
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-[var(--container-max)] gap-0 px-0">
        {/* Filtres */}
        <aside className="hidden w-[264px] shrink-0 border-r border-[var(--border-subtle)] px-6 py-7 lg:block">
          {hasFilters && (
            <Link
              href="/catalogue"
              className="mb-5 inline-block text-[13px] font-semibold text-rose-600 hover:underline"
            >
              Tout effacer
            </Link>
          )}

          <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Catégories
          </div>
          <div className="flex flex-col gap-1.5">
            {byCategory.map((c) => {
              const active = c.category === categorie;
              return (
                <Link
                  key={c.category}
                  href={qs({ categorie: active ? "" : c.category })}
                  className={`flex items-center gap-2.5 text-[14px] ${
                    active ? "font-bold text-green-900" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[4px] text-[10px] text-white ${
                      active ? "bg-green-700" : "shadow-[inset_0_0_0_1.5px_var(--border-default)]"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                  {c.category} <span className="text-[var(--text-muted)]">({c._count._all})</span>
                </Link>
              );
            })}
          </div>

          <div className="my-6 h-px bg-[var(--border-subtle)]" />

          <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Producteurs
          </div>
          <div className="flex flex-col gap-1.5">
            {producers.map((p) => {
              const active = p.slug === producteur;
              return (
                <Link
                  key={p.slug}
                  href={qs({ producteur: active ? "" : p.slug })}
                  className={`flex items-center gap-2.5 text-[14px] ${
                    active ? "font-bold text-green-900" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[4px] text-[10px] text-white ${
                      active ? "bg-green-700" : "shadow-[inset_0_0_0_1.5px_var(--border-default)]"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                  {p.farmName}{" "}
                  <span className="text-[var(--text-muted)]">({p._count.products})</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Grille produits */}
        <div className="min-w-0 flex-1 px-[var(--container-pad)] py-7 pb-24">
          {products.length === 0 ? (
            <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-10 text-center shadow-[var(--shadow-s)]">
              <div className="font-display text-[20px] text-[var(--text-primary)]">
                Aucun produit ne correspond
              </div>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                Essayez d&apos;élargir votre recherche ou de retirer un filtre.
              </p>
              <Link
                href="/catalogue"
                className="mt-4 inline-block text-[14px] font-semibold text-[var(--text-brand)] hover:underline"
              >
                Voir tout le catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <Link
                  key={p.slug}
                  href={`/catalogue/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)] transition-shadow hover:shadow-[var(--shadow-l)]"
                >
                  <div className="relative aspect-[4/3] bg-[var(--surface-sunken)]">
                    {p.photoUrl && (
                      <Image
                        src={p.photoUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 260px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3.5 pb-4">
                    <div className="text-[14px] font-bold leading-snug text-[var(--text-primary)]">
                      {p.name}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold text-[var(--text-brand)]">
                      {p.producer.farmName}
                    </div>
                    <div className="mt-1.5 text-[12px] text-[var(--text-muted)]">
                      Vendu par {p.unit}
                    </div>
                    <div className="mt-auto pt-2 font-display text-[18px] text-[var(--text-primary)]">
                      {eur(Number(p.basePrice))}{" "}
                      <span className="font-body text-[11px] font-normal text-[var(--text-muted)]">
                        HT
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
