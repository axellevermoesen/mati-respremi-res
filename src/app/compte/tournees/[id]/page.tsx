import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import {
  TOUR_STATUS_LABEL,
  TOUR_STATUS_TONE,
  TOUR_STEPS,
  NEXT_TOUR_LABEL,
  TOUR_ELIGIBLE_ORDER_STATUS,
} from "@/lib/tours";
import { TourControls, MyOrdersOnTour } from "./TourDetailClient";

export const metadata: Metadata = { title: "Tournée" };

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function frDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");

  const me = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  );
  if (!me) redirect("/compte");

  const tour = await withRetry(() =>
    prisma.deliveryTour.findUnique({
      where: { id },
      select: {
        id: true,
        date: true,
        region: true,
        status: true,
        notes: true,
        driverProducerId: true,
        stops: {
          orderBy: { sequence: "asc" },
          select: {
            producerId: true,
            producer: { select: { farmName: true } },
            orders: {
              select: {
                id: true,
                reference: true,
                total: true,
                producerId: true,
                deliveryAddress: { select: { city: true } },
                buyer: { select: { companyName: true } },
              },
            },
          },
        },
      },
    }),
  );
  if (!tour) notFound();

  const myStop = tour.stops.find((s) => s.producerId === me.id);
  const amMember = Boolean(myStop);

  const members = tour.stops.map((s) => ({
    producerId: s.producerId,
    farmName: s.producer.farmName,
  }));
  const driverName =
    tour.stops.find((s) => s.producerId === tour.driverProducerId)?.producer.farmName ?? null;

  const totalOrders = tour.stops.reduce((n, s) => n + s.orders.length, 0);
  const stopIdx = TOUR_STEPS.indexOf(tour.status);
  const nextLabel =
    tour.status === "DONE" || tour.status === "CANCELLED" ? null : NEXT_TOUR_LABEL[tour.status];

  // Commandes du producteur connecté : rattachées vs. éligibles
  const attached = (myStop?.orders ?? []).map((o) => ({
    id: o.id,
    reference: o.reference,
    town: o.deliveryAddress?.city ?? "—",
    total: eur(Number(o.total)),
  }));

  const eligibleRows = amMember
    ? await withRetry(() =>
        prisma.order.findMany({
          where: {
            producerId: me.id,
            tourStopId: null,
            status: { in: [...TOUR_ELIGIBLE_ORDER_STATUS] },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reference: true,
            total: true,
            deliveryAddress: { select: { city: true } },
          },
        }),
      )
    : [];
  const eligible = eligibleRows.map((o) => ({
    id: o.id,
    reference: o.reference,
    town: o.deliveryAddress?.city ?? "—",
    total: eur(Number(o.total)),
  }));

  return (
      <main className="mx-auto w-full max-w-[860px] px-[var(--container-pad)] pb-24 pt-10">
        <Link
          href="/compte/tournees"
          className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
        >
          ← Toutes les tournées
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Tournée · {tour.region}
            </div>
            <h1 className="mt-1 font-display text-[var(--text-display-m)] capitalize text-[var(--text-primary)]">
              {frDate(tour.date)}
            </h1>
            <div className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {tour.stops.length} producteur{tour.stops.length > 1 ? "s" : ""} · {totalOrders}{" "}
              commande{totalOrders > 1 ? "s" : ""}
              {driverName ? ` · chauffeur : ${driverName}` : " · chauffeur non défini"}
            </div>
          </div>
          <Badge tone={TOUR_STATUS_TONE[tour.status]}>{TOUR_STATUS_LABEL[tour.status]}</Badge>
        </div>

        {tour.status !== "CANCELLED" && (
          <div className="mt-6 flex items-center gap-1.5">
            {TOUR_STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`h-1.5 w-full rounded-full ${
                    i <= stopIdx ? "bg-green-700" : "bg-[var(--sand-200)]"
                  }`}
                />
                <span
                  className={`text-center text-[10px] ${
                    i <= stopIdx ? "font-semibold text-green-900" : "text-[var(--text-muted)]"
                  }`}
                >
                  {TOUR_STATUS_LABEL[s]}
                </span>
              </div>
            ))}
          </div>
        )}

        {tour.notes && (
          <p className="mt-4 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
            {tour.notes}
          </p>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5">
            {/* Participants */}
            <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
              <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Producteurs de la tournée
              </div>
              <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
                {tour.stops.map((s) => {
                  const towns = [
                    ...new Set(s.orders.map((o) => o.deliveryAddress?.city).filter(Boolean)),
                  ];
                  return (
                    <div key={s.producerId} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--text-primary)]">
                          {s.producer.farmName}
                          {s.producerId === tour.driverProducerId && (
                            <span className="rounded-[var(--radius-pill)] bg-[var(--rose-100)] px-2 py-0.5 text-[10px] font-bold uppercase text-green-900">
                              Chauffeur
                            </span>
                          )}
                          {s.producerId === me.id && (
                            <span className="text-[11px] font-normal text-[var(--text-muted)]">
                              (vous)
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                          {s.orders.length} commande{s.orders.length > 1 ? "s" : ""}
                          {towns.length > 0 ? ` → ${towns.join(", ")}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Livraisons regroupées */}
            <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
              <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Points de livraison
              </div>
              {totalOrders === 0 ? (
                <p className="text-[13px] text-[var(--text-muted)]">
                  Aucune commande sur cette tournée pour l&apos;instant.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tour.stops
                    .flatMap((s) => s.orders)
                    .map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-[13px]"
                      >
                        <span className="text-[var(--text-secondary)]">
                          {o.buyer.companyName} — {o.deliveryAddress?.city ?? "—"}
                        </span>
                        <span className="font-mono text-[11px] uppercase text-[var(--text-muted)]">
                          {o.reference}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {amMember && (
              <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
                <MyOrdersOnTour tourId={tour.id} attached={attached} eligible={eligible} />
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
            {amMember ? (
              <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
                <TourControls
                  tourId={tour.id}
                  nextLabel={nextLabel}
                  members={members}
                  driverId={tour.driverProducerId}
                  amMember={amMember}
                />
              </div>
            ) : (
              <div className="rounded-[var(--radius-l)] bg-[var(--surface-inverse)] p-5 text-white">
                <div className="font-display text-[16px]">Vous ne participez pas</div>
                <p className="mt-2 text-[13px] text-[hsl(45_30%_96%_/_0.8)]">
                  Rejoignez cette tournée depuis la liste pour y ajouter vos commandes.
                </p>
                <Link
                  href="/compte/tournees"
                  className="mt-3 inline-block text-[13px] font-semibold underline"
                >
                  Voir les tournées
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
  );
}
