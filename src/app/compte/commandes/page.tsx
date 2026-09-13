import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders";

export const metadata: Metadata = { title: "Mes commandes" };

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function frDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function CommandesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const isProducer = session.user.role === "PRODUCER";

  const orders = await withRetry(() =>
    prisma.order.findMany({
      where: isProducer
        ? { producer: { userId: session.user.id }, status: { not: "DRAFT" } }
        : { buyer: { userId: session.user.id }, status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
      select: {
        reference: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        total: true,
        producer: { select: { farmName: true } },
        buyer: { select: { companyName: true } },
        _count: { select: { items: true } },
      },
    }),
  );

  return (
    <>
      {!isProducer && <SiteHeader />}
      <main className="mx-auto w-full max-w-[840px] px-[var(--container-pad)] pb-24 pt-10">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
          {isProducer ? "Espace producteur" : "Mon compte"}
        </div>
        <h1 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
          {isProducer ? "Commandes reçues" : "Mes commandes"}
        </h1>

        {orders.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-10 text-center shadow-[var(--shadow-s)]">
            <p className="text-[15px] text-[var(--text-secondary)]">
              {isProducer
                ? "Aucune commande pour l'instant. Elles apparaîtront ici dès qu'un restaurant commandera vos produits."
                : "Vous n'avez pas encore passé de commande."}
            </p>
            {!isProducer && (
              <Link
                href="/catalogue"
                className="mt-4 inline-block text-[14px] font-semibold text-[var(--text-brand)] hover:underline"
              >
                Parcourir le catalogue
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {orders.map((o) => (
              <Link
                key={o.reference}
                href={`/compte/commandes/${o.reference}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)] transition-shadow hover:shadow-[var(--shadow-m)]"
              >
                <div className="min-w-[140px]">
                  <div className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    {o.reference}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                    {frDate(o.createdAt)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-[var(--text-primary)]">
                    {isProducer ? o.buyer.companyName : o.producer.farmName}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[var(--text-muted)]">
                    {o._count.items} article{o._count.items > 1 ? "s" : ""} ·{" "}
                    {PAYMENT_STATUS_LABEL[o.paymentStatus]}
                  </div>
                </div>
                <Badge tone={ORDER_STATUS_TONE[o.status]}>
                  {ORDER_STATUS_LABEL[o.status]}
                </Badge>
                <div className="font-display text-[16px] text-green-900">
                  {eur(Number(o.total))}
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-[13px] text-[var(--text-muted)]">
          <Link href="/compte" className="hover:underline">
            ← Retour au compte
          </Link>
        </p>
      </main>
      {!isProducer && <SiteFooter />}
    </>
  );
}
