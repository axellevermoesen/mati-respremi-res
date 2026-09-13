import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/Badge";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_STEPS,
  PAYMENT_STATUS_LABEL,
  NEXT_STATUS_LABEL,
} from "@/lib/orders";
import { OrderActions } from "./OrderActions";

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function frDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Commande ${reference}` };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const isProducer = session.user.role === "PRODUCER";

  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: {
        reference,
        ...(isProducer
          ? { producer: { userId: session.user.id } }
          : { buyer: { userId: session.user.id } }),
      },
      select: {
        reference: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        deliveryMode: true,
        subtotal: true,
        vatTotal: true,
        total: true,
        deliveryFee: true,
        note: true,
        producer: {
          select: { farmName: true, slug: true, leadTimeDays: true, deliveryDays: true },
        },
        buyer: { select: { companyName: true, phone: true } },
        tourStop: {
          select: {
            tour: { select: { id: true, date: true, region: true, status: true } },
          },
        },
        deliveryAddress: {
          select: { label: true, line1: true, line2: true, postcode: true, city: true, notes: true },
        },
        items: {
          select: { name: true, unit: true, quantity: true, unitPrice: true, lineTotal: true },
        },
      },
    }),
  );
  if (!order) notFound();

  const cancelled = order.status === "CANCELLED";
  const tour = order.tourStop?.tour;
  const currentStepIdx = ORDER_STEPS.indexOf(order.status);
  const nextLabel = isProducer ? NEXT_STATUS_LABEL[order.status] || null : null;
  const canCancel = isProducer && !cancelled && order.status !== "DELIVERED";

  return (
    <>
      {!isProducer && <SiteHeader />}
      <main className="mx-auto w-full max-w-[820px] px-[var(--container-pad)] pb-24 pt-10">
        <Link
          href="/compte/commandes"
          className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
        >
          ← Toutes les commandes
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              {order.reference} · {frDate(order.createdAt)}
            </div>
            <h1 className="mt-1 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
              {isProducer ? order.buyer.companyName : order.producer.farmName}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            <span className="text-[12px] text-[var(--text-muted)]">
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </span>
          </div>
        </div>

        {tour && (
          <div className="mt-5 flex items-center gap-3 rounded-[var(--radius-m)] bg-[var(--rose-100)] px-4 py-3 text-[13px] text-green-900">
            <span className="text-[16px]">🚚</span>
            <span>
              Livraison groupée le{" "}
              <strong className="capitalize">
                {tour.date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </strong>{" "}
              — tournée mutualisée {tour.region}.
              {isProducer && (
                <>
                  {" "}
                  <Link href={`/compte/tournees/${tour.id}`} className="font-semibold underline">
                    Voir la tournée
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        {/* Timeline */}
        {!cancelled && (
          <div className="mt-6 flex items-center gap-1.5">
            {ORDER_STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`h-1.5 w-full rounded-full ${
                    i <= currentStepIdx ? "bg-green-700" : "bg-[var(--sand-200)]"
                  }`}
                />
                <span
                  className={`text-center text-[10px] ${
                    i <= currentStepIdx ? "font-semibold text-green-900" : "text-[var(--text-muted)]"
                  }`}
                >
                  {ORDER_STATUS_LABEL[s]}
                </span>
              </div>
            ))}
          </div>
        )}

        {isProducer && (nextLabel || canCancel) && (
          <div className="mt-6 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
            <OrderActions reference={order.reference} nextLabel={nextLabel} canCancel={canCancel} />
          </div>
        )}

        {/* Articles */}
        <div className="mt-6 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
          <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Détail
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between gap-4 py-2.5 text-[14px]">
                <span className="text-[var(--text-secondary)]">
                  {it.name}{" "}
                  <span className="text-[var(--text-muted)]">
                    — {String(it.quantity)} × {eur(Number(it.unitPrice))} / {it.unit}
                  </span>
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {eur(Number(it.lineTotal))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-[var(--border-subtle)] pt-3 text-[14px]">
            <Line label="Sous-total HT" value={eur(Number(order.subtotal))} />
            <Line label="TVA" value={eur(Number(order.vatTotal))} />
            <Line label="Livraison" value={eur(Number(order.deliveryFee))} />
            <div className="mt-1 flex justify-between text-[16px]">
              <span className="font-bold text-[var(--text-primary)]">Total TTC</span>
              <span className="font-display text-green-900">{eur(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Livraison + contact */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
            <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Livraison
            </div>
            {order.deliveryAddress ? (
              <div className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
                <div className="font-semibold text-[var(--text-primary)]">
                  {order.deliveryAddress.label}
                </div>
                {order.deliveryAddress.line1}
                {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}
                <br />
                {order.deliveryAddress.postcode} {order.deliveryAddress.city}
                {order.deliveryAddress.notes && (
                  <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                    {order.deliveryAddress.notes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">Adresse non renseignée.</p>
            )}
            <div className="mt-2 text-[12px] text-[var(--text-muted)]">
              Préavis producteur {order.producer.leadTimeDays} j
              {order.producer.deliveryDays ? ` · tournées : ${order.producer.deliveryDays}` : ""}
            </div>
          </div>

          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
            <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              {isProducer ? "Client" : "Producteur"}
            </div>
            {isProducer ? (
              <div className="text-[14px] text-[var(--text-secondary)]">
                <div className="font-semibold text-[var(--text-primary)]">
                  {order.buyer.companyName}
                </div>
                {order.buyer.phone && <div>{order.buyer.phone}</div>}
              </div>
            ) : (
              <Link
                href={`/producteurs/${order.producer.slug}`}
                className="text-[14px] font-semibold text-[var(--text-brand)] hover:underline"
              >
                {order.producer.farmName}
              </Link>
            )}
          </div>
        </div>
      </main>
      {!isProducer && <SiteFooter />}
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
