import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartQty } from "./CartQty";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Mon panier" };

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default async function PanierPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?role=acheteur");
  if (session.user.role !== "RESTAURANT" && session.user.role !== "RESELLER") {
    redirect("/compte");
  }

  const buyer = await withRetry(() =>
    prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        addresses: {
          orderBy: { isDefault: "desc" },
          select: { id: true, label: true, line1: true, postcode: true, city: true },
        },
        cart: {
          select: {
            items: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                quantity: true,
                product: {
                  select: {
                    slug: true,
                    name: true,
                    unit: true,
                    photoUrl: true,
                    basePrice: true,
                    vatRate: true,
                    producer: {
                      select: {
                        slug: true,
                        farmName: true,
                        minOrderValue: true,
                        freeShippingFrom: true,
                        leadTimeDays: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
  if (!buyer) redirect("/compte");

  const items = buyer.cart?.items ?? [];

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-20 text-center">
          <h1 className="font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
            Votre panier est vide
          </h1>
          <p className="mx-auto mt-3 max-w-[420px] text-[15px] text-[var(--text-secondary)]">
            Parcourez le catalogue et ajoutez les produits dont vous avez besoin — ils se regrouperont
            par producteur.
          </p>
          <Link
            href="/catalogue"
            className="mt-5 inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[15px] font-bold text-white hover:bg-green-900"
          >
            Parcourir le catalogue
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  // Regroupement par producteur
  type Item = (typeof items)[number];
  const groups = new Map<string, { producer: Item["product"]["producer"]; lines: Item[] }>();
  for (const it of items) {
    const key = it.product.producer.slug;
    if (!groups.has(key)) groups.set(key, { producer: it.product.producer, lines: [] });
    groups.get(key)!.lines.push(it);
  }

  let grandHT = 0;
  let grandTVA = 0;
  let blocked: string | undefined;

  const rendered = [...groups.values()].map(({ producer, lines }) => {
    const subHT = lines.reduce(
      (s, l) => s + Number(l.product.basePrice) * l.quantity,
      0,
    );
    const subTVA = lines.reduce(
      (s, l) => s + Number(l.product.basePrice) * l.quantity * (Number(l.product.vatRate) / 100),
      0,
    );
    grandHT += subHT;
    grandTVA += subTVA;

    const min = producer.minOrderValue ? Number(producer.minOrderValue) : 0;
    const franco = producer.freeShippingFrom ? Number(producer.freeShippingFrom) : 0;
    const belowMin = min > 0 && subHT < min;
    if (belowMin && !blocked) {
      blocked = `Ajoutez ${eur(min - subHT)} pour atteindre le minimum de ${producer.farmName}.`;
    }

    return { producer, lines, subHT, subTVA, min, franco, belowMin };
  });

  const canCheckout = !blocked && buyer.addresses.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-24 pt-8">
        <h1 className="font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
          Mon panier
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
          {items.length} article{items.length > 1 ? "s" : ""} · {groups.size} producteur
          {groups.size > 1 ? "s" : ""} — une commande sera créée par producteur.
        </p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Colonnes articles groupés */}
          <div className="flex flex-col gap-5">
            {rendered.map(({ producer, lines, subHT, min, franco, belowMin }) => (
              <section
                key={producer.slug}
                className="overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-3.5">
                  <Link
                    href={`/producteurs/${producer.slug}`}
                    className="font-display text-[17px] text-green-900 hover:underline"
                  >
                    {producer.farmName}
                  </Link>
                  <span className="text-[13px] text-[var(--text-muted)]">
                    Préavis {producer.leadTimeDays} j
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                  {lines.map((l) => (
                    <div key={l.id} className="flex gap-4 p-5">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-s)] bg-[var(--surface-sunken)]">
                        {l.product.photoUrl && (
                          <Image
                            src={l.product.photoUrl}
                            alt={l.product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Link
                          href={`/catalogue/${l.product.slug}`}
                          className="text-[14px] font-bold text-[var(--text-primary)] hover:underline"
                        >
                          {l.product.name}
                        </Link>
                        <div className="text-[12px] text-[var(--text-muted)]">
                          {eur(Number(l.product.basePrice))} HT / {l.product.unit}
                        </div>
                        <CartQty itemId={l.id} quantity={l.quantity} />
                      </div>
                      <div className="shrink-0 text-right font-display text-[15px] text-[var(--text-primary)]">
                        {eur(Number(l.product.basePrice) * l.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5 bg-[var(--surface-sunken)] px-5 py-3.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Sous-total {producer.farmName}</span>
                    <span className="font-bold text-[var(--text-primary)]">{eur(subHT)} HT</span>
                  </div>
                  {min > 0 && (
                    <div className={belowMin ? "text-[var(--state-danger)]" : "text-[var(--text-muted)]"}>
                      {belowMin
                        ? `Minimum de commande ${eur(min)} — il manque ${eur(min - subHT)}.`
                        : `Minimum de commande atteint (${eur(min)}).`}
                    </div>
                  )}
                  {franco > 0 && (
                    <div className="text-[var(--text-muted)]">
                      {subHT >= franco
                        ? "Livraison offerte (franco atteint)."
                        : `Franco à ${eur(franco)} — plus que ${eur(franco - subHT)}.`}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Récap + checkout */}
          <aside className="flex flex-col gap-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)] lg:sticky lg:top-[88px]">
            <div className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Sous-total HT</span>
                <span className="font-semibold text-[var(--text-primary)]">{eur(grandHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">TVA</span>
                <span className="font-semibold text-[var(--text-primary)]">{eur(grandTVA)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Livraison</span>
                <span className="text-[var(--text-muted)]">calculée par producteur</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-[var(--border-subtle)] pt-2 text-[16px]">
                <span className="font-bold text-[var(--text-primary)]">Total TTC</span>
                <span className="font-display text-green-900">{eur(grandHT + grandTVA)}</span>
              </div>
            </div>

            <CheckoutForm
              addresses={buyer.addresses}
              canCheckout={canCheckout}
              blockedReason={blocked}
            />

            <Link
              href="/catalogue"
              className="text-center text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
            >
              Continuer mes achats
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
