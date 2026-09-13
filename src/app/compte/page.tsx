import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/orders";
import type { ProducerProfile, BuyerProfile, User } from "@prisma/client";

export const metadata: Metadata = { title: "Tableau de bord" };

const ROLE_LABEL: Record<string, string> = {
  PRODUCER: "Producteur",
  RESTAURANT: "Restaurant",
  RESELLER: "Épicerie / revendeur",
  ADMIN: "Administrateur",
};

function eur(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function frDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function frLongDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

export default async function ComptePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { producerProfile: true, buyerProfile: true },
    }),
  );
  if (!user) redirect("/connexion");

  if (user.role === "PRODUCER") {
    if (!user.producerProfile) redirect("/inscription/producteur");
    return <ProducerDashboard profile={user.producerProfile} />;
  }

  return <BuyerAccount user={user} />;
}

/* --------------------------------------------------------------------------- */
/*  Tableau de bord producteur                                                  */
/* --------------------------------------------------------------------------- */

async function ProducerDashboard({ profile }: { profile: ProducerProfile }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [ordersThisMonth, revenueAgg, upcomingTours, productsOnline, recentOrders, nextTour] =
    await Promise.all([
      withRetry(() =>
        prisma.order.count({
          where: { producerId: profile.id, status: { not: "DRAFT" }, createdAt: { gte: monthStart } },
        }),
      ),
      withRetry(() =>
        prisma.order.aggregate({
          _sum: { total: true },
          where: {
            producerId: profile.id,
            status: { notIn: ["DRAFT", "CANCELLED"] },
            createdAt: { gte: monthStart },
          },
        }),
      ),
      withRetry(() =>
        prisma.deliveryTour.count({
          where: {
            stops: { some: { producerId: profile.id } },
            date: { gte: todayStart },
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        }),
      ),
      withRetry(() =>
        prisma.product.count({ where: { producerId: profile.id, isActive: true } }),
      ),
      withRetry(() =>
        prisma.order.findMany({
          where: { producerId: profile.id, status: { not: "DRAFT" } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            reference: true,
            createdAt: true,
            status: true,
            total: true,
            buyer: { select: { companyName: true } },
            _count: { select: { items: true } },
          },
        }),
      ),
      withRetry(() =>
        prisma.deliveryTour.findFirst({
          where: {
            stops: { some: { producerId: profile.id } },
            date: { gte: todayStart },
            status: { notIn: ["DONE", "CANCELLED"] },
          },
          orderBy: { date: "asc" },
          select: {
            id: true,
            date: true,
            region: true,
            stops: { select: { _count: { select: { orders: true } } } },
          },
        }),
      ),
    ]);

  const revenue = Number(revenueAgg._sum.total ?? 0);
  const tourDeliveries = nextTour
    ? nextTour.stops.reduce((s, st) => s + st._count.orders, 0)
    : 0;
  const tourProducers = nextTour ? nextTour.stops.length : 0;

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-12">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
              Bonjour, {profile.farmName}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]">Votre tableau de bord</p>
          </div>
          <Button href="/compte/produits">Ajouter un produit</Button>
        </div>

        {/* KPIs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Commandes ce mois" value={String(ordersThisMonth)} hint="depuis le 1er du mois" />
          <Kpi label="Chiffre d'affaires" value={eur(revenue)} hint="TTC, ce mois-ci" />
          <Kpi
            label="Tournées à venir"
            value={String(upcomingTours)}
            hint="livraisons mutualisées planifiées"
          />
          <Kpi label="Produits en ligne" value={String(productsOnline)} hint="visibles au catalogue" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Commandes récentes */}
          <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-s)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[18px] text-[var(--text-primary)]">
                Commandes récentes
              </h2>
              <Link
                href="/compte/commandes"
                className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
              >
                Tout voir →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">
                Aucune commande pour l&apos;instant.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {recentOrders.map((o) => (
                  <Link
                    key={o.reference}
                    href={`/compte/commandes/${o.reference}`}
                    className="flex items-center justify-between gap-4 py-3 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                        {o.buyer.companyName}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">
                        {o._count.items} article{o._count.items > 1 ? "s" : ""} · {frDate(o.createdAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {eur(Number(o.total))}
                      </span>
                      <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-6">
            {/* Prochaine tournée */}
            <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-s)]">
              <h2 className="mb-3 font-display text-[18px] text-[var(--text-primary)]">
                Votre prochaine tournée mutualisée
              </h2>
              {nextTour ? (
                <>
                  <div className="text-[14px] font-semibold capitalize text-green-900">
                    {frLongDate(nextTour.date)}
                  </div>
                  <div className="text-[13px] text-[var(--text-muted)]">Secteur {nextTour.region}</div>
                  <div className="mt-3 rounded-[var(--radius-m)] bg-[var(--rose-100)] px-4 py-3 text-[13px] text-green-900">
                    {tourDeliveries} restaurant{tourDeliveries > 1 ? "s" : ""} livré
                    {tourDeliveries > 1 ? "s" : ""} en un seul passage, avec {tourProducers} producteur
                    {tourProducers > 1 ? "s" : ""}.
                  </div>
                  <Button href={`/compte/tournees/${nextTour.id}`} variant="outline" className="mt-4">
                    Détails de la tournée
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-[var(--text-muted)]">
                    Aucune tournée planifiée. Regroupez vos livraisons avec d&apos;autres producteurs
                    de votre secteur.
                  </p>
                  <Button href="/compte/tournees" variant="outline" className="mt-4">
                    Organiser une tournée
                  </Button>
                </>
              )}
            </section>

            {/* Ma page vitrine */}
            <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-s)]">
              <h2 className="mb-3 font-display text-[18px] text-[var(--text-primary)]">
                Ma page vitrine
              </h2>
              <div className="flex gap-4">
                <div className="relative h-[64px] w-[96px] shrink-0 overflow-hidden rounded-[var(--radius-m)] bg-[var(--sand-200)]">
                  {profile.coverUrl && (
                    <Image
                      src={profile.coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                    {profile.farmName}
                  </div>
                  <div className="line-clamp-2 text-[12px] text-[var(--text-muted)]">
                    {profile.tagline || "Ajoutez une accroche pour présenter votre exploitation."}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/compte/ma-page" variant="outline">
                  Modifier ma page
                </Button>
                <Button href={`/producteurs/${profile.slug}`} variant="ghost">
                  Voir en ligne
                </Button>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-10">
          <form action={logoutAction}>
            <Button variant="ghost" type="submit">
              Se déconnecter
            </Button>
          </form>
        </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2 font-display text-[26px] text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[12px] text-[var(--text-muted)]">{hint}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  Compte acheteur (inchangé)                                                  */
/* --------------------------------------------------------------------------- */

async function BuyerAccount({
  user,
}: {
  user: User & { buyerProfile: BuyerProfile | null };
}) {
  const displayName = user.buyerProfile?.companyName ?? user.name ?? user.email;

  return (
    <main className="py-16">
      <Container className="max-w-[640px]">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
          Mon compte
        </div>
        <h1 className="mt-2 font-display text-[var(--text-display-m)]">Bonjour {displayName}</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Tu es connecté. Voici ton compte — les réglages détaillés arriveront bientôt.
        </p>

        <div className="mt-8 flex flex-col gap-3 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
          <Row label="Type de compte">
            <Badge tone="brand">{ROLE_LABEL[user.role] ?? user.role}</Badge>
          </Row>
          <div className="h-px bg-[var(--border-subtle)]" />
          <Row label="Email">{user.email}</Row>
          <div className="h-px bg-[var(--border-subtle)]" />
          <Row label="Nom">{displayName}</Row>
          {user.buyerProfile?.siret && (
            <>
              <div className="h-px bg-[var(--border-subtle)]" />
              <Row label="SIRET">{user.buyerProfile.siret}</Row>
            </>
          )}
          {user.buyerProfile?.phone && (
            <>
              <div className="h-px bg-[var(--border-subtle)]" />
              <Row label="Téléphone">{user.buyerProfile.phone}</Row>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button href="/compte/commandes" variant="outline">
            Mes commandes
          </Button>
          <Button href="/catalogue" variant="outline">
            Parcourir le catalogue
          </Button>
          <form action={logoutAction}>
            <Button variant="ghost" type="submit">
              Se déconnecter
            </Button>
          </form>
        </div>

        <p className="mt-10 text-[13px] text-[var(--text-muted)]">
          <Link href="/" className="hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </Container>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</span>
      <span className="text-[15px] text-[var(--text-primary)]">{children}</span>
    </div>
  );
}
