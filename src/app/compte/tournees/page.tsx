import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { TOUR_STATUS_LABEL, TOUR_STATUS_TONE, TOUR_ELIGIBLE_ORDER_STATUS } from "@/lib/tours";
import { CreateTourForm, JoinButton } from "./TourListClient";

export const metadata: Metadata = { title: "Tournées mutualisées" };

function frDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

export default async function TourneesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");

  const me = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, region: true },
    }),
  );
  if (!me) redirect("/compte");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [mine, joinable, unplanned] = await withRetry(() =>
    Promise.all([
      prisma.deliveryTour.findMany({
        where: { stops: { some: { producerId: me.id } } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          region: true,
          status: true,
          _count: { select: { stops: true } },
          stops: { select: { _count: { select: { orders: true } } } },
        },
      }),
      prisma.deliveryTour.findMany({
        where: {
          region: me.region,
          status: { in: ["PLANNED", "CONFIRMED"] },
          date: { gte: startOfToday },
          stops: { none: { producerId: me.id } },
        },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          status: true,
          _count: { select: { stops: true } },
        },
      }),
      prisma.order.count({
        where: {
          producer: { userId: session.user.id },
          tourStopId: null,
          status: { in: [...TOUR_ELIGIBLE_ORDER_STATUS] },
        },
      }),
    ]),
  );

  return (
      <main className="mx-auto w-full max-w-[880px] px-[var(--container-pad)] pb-24 pt-10">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
          Espace producteur
        </div>
        <h1 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
          Tournées mutualisées
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-[var(--text-secondary)]">
          Regroupez vos livraisons avec les producteurs de votre région : une seule tournée, un seul
          camion, une seule réception en cuisine.
        </p>

        {unplanned > 0 && (
          <div className="mt-5 rounded-[var(--radius-m)] bg-[var(--rose-100)] px-4 py-3 text-[13px] text-green-900">
            {unplanned} commande{unplanned > 1 ? "s" : ""} confirmée{unplanned > 1 ? "s" : ""} à
            planifier — ajoutez-les à une tournée.
          </div>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Mes tournées
              </div>
              {mine.length === 0 ? (
                <p className="text-[14px] text-[var(--text-muted)]">
                  Vous ne participez à aucune tournée. Créez-en une ou rejoignez celles de votre
                  région.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {mine.map((t) => {
                    const orders = t.stops.reduce((s, st) => s + st._count.orders, 0);
                    return (
                      <Link
                        key={t.id}
                        href={`/compte/tournees/${t.id}`}
                        className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)] hover:shadow-[var(--shadow-m)]"
                      >
                        <div className="min-w-[160px] font-display text-[15px] capitalize text-green-900">
                          {frDate(t.date)}
                        </div>
                        <div className="flex-1 text-[13px] text-[var(--text-secondary)]">
                          {t.region} · {t._count.stops} producteur
                          {t._count.stops > 1 ? "s" : ""} · {orders} commande
                          {orders > 1 ? "s" : ""}
                        </div>
                        <Badge tone={TOUR_STATUS_TONE[t.status]}>
                          {TOUR_STATUS_LABEL[t.status]}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                À rejoindre dans votre région
              </div>
              {joinable.length === 0 ? (
                <p className="text-[14px] text-[var(--text-muted)]">
                  Aucune tournée ouverte pour {me.region || "votre région"}.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {joinable.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-s)]"
                    >
                      <div className="min-w-[160px] font-display text-[15px] capitalize text-green-900">
                        {frDate(t.date)}
                      </div>
                      <div className="flex-1 text-[13px] text-[var(--text-secondary)]">
                        {t._count.stops} producteur{t._count.stops > 1 ? "s" : ""} déjà inscrit
                        {t._count.stops > 1 ? "s" : ""}
                      </div>
                      <JoinButton tourId={t.id} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-[88px]">
            <CreateTourForm region={me.region} />
          </aside>
        </div>

        <p className="mt-10 text-[13px] text-[var(--text-muted)]">
          <Link href="/compte" className="hover:underline">
            ← Retour au compte
          </Link>
        </p>
      </main>
  );
}
