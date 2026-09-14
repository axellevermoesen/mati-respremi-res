import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { AccountActions } from "./AccountActions";

const ROLE_LABEL: Record<string, string> = {
  PRODUCER: "Producteur",
  RESTAURANT: "Restaurateur",
  RESELLER: "Revendeur",
};

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id },
      include: {
        producerProfile: {
          include: { _count: { select: { ordersReceived: true, products: true } } },
        },
        buyerProfile: { include: { _count: { select: { orders: true } } } },
      },
    }),
  );
  if (!user || user.role === "ADMIN") notFound();

  const orderCount =
    (user.producerProfile?._count.ordersReceived ?? 0) + (user.buyerProfile?._count.orders ?? 0);

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/comptes" className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-green-900">
        ← Tous les comptes
      </Link>

      <div className="mt-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] text-[var(--text-primary)]">
              {user.name || user.email}
            </h1>
            <div className="mt-1 text-[13px] text-[var(--text-muted)]">
              {ROLE_LABEL[user.role] ?? user.role} · inscrit le {user.createdAt.toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-5 text-[14px]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Email
            </div>
            <div className="mt-1 text-[var(--text-primary)]">{user.email}</div>
          </div>
          {user.producerProfile && (
            <>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Région
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.producerProfile.region || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Produits publiés
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.producerProfile._count.products}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Commandes reçues
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.producerProfile._count.ordersReceived}</div>
              </div>
              <div className="col-span-2">
                <Link
                  href={`/producteurs/${user.producerProfile.slug}`}
                  target="_blank"
                  className="text-[13px] font-semibold text-green-700 hover:underline"
                >
                  Voir la fiche publique ↗
                </Link>
                <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                  Visible uniquement si le compte est actif.
                </div>
              </div>
            </>
          )}
          {user.buyerProfile && (
            <>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Structure
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.buyerProfile.companyName}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  SIRET
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.buyerProfile.siret || "—"}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Commandes passées
                </div>
                <div className="mt-1 text-[var(--text-primary)]">{user.buyerProfile._count.orders}</div>
              </div>
            </>
          )}
        </div>

        <AccountActions userId={user.id} status={user.status} orderCount={orderCount} />
      </div>
    </div>
  );
}
