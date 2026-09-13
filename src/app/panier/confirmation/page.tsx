import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = { title: "Commande confirmée" };

function eur(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ refs?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const { refs } = await searchParams;
  const list = (refs ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) redirect("/catalogue");

  const orders = await withRetry(() =>
    prisma.order.findMany({
      where: {
        reference: { in: list },
        buyer: { userId: session.user.id },
      },
      orderBy: { reference: "asc" },
      select: {
        reference: true,
        total: true,
        producer: { select: { farmName: true, leadTimeDays: true } },
        items: { select: { name: true, quantity: true, unit: true, lineTotal: true } },
      },
    }),
  );
  if (orders.length === 0) redirect("/catalogue");

  const grand = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[760px] px-[var(--container-pad)] pb-24 pt-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rose-100)] text-green-900">
            ✓
          </span>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
            Commande confirmée
          </div>
        </div>
        <h1 className="mt-3 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
          C&apos;est envoyé. {orders.length > 1 ? `${orders.length} commandes créées.` : "Votre commande est créée."}
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
          Chaque producteur reçoit sa commande et la confirme. Le paiement se fait sur facture,
          directement avec eux. Vous retrouverez le suivi dans votre espace.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {orders.map((o) => (
            <div
              key={o.reference}
              className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-[17px] text-green-900">{o.producer.farmName}</div>
                <div className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  {o.reference}
                </div>
              </div>
              <div className="mt-3 flex flex-col divide-y divide-[var(--border-subtle)]">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2 text-[14px]">
                    <span className="text-[var(--text-secondary)]">
                      {it.name} <span className="text-[var(--text-muted)]">× {String(it.quantity)}</span>
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {eur(Number(it.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-[var(--border-subtle)] pt-3 text-[15px]">
                <span className="text-[var(--text-secondary)]">Total TTC</span>
                <span className="font-display text-green-900">{eur(Number(o.total))}</span>
              </div>
              <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                Préavis producteur : {o.producer.leadTimeDays} jours
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-[var(--radius-l)] bg-[var(--surface-inverse)] px-5 py-4 text-white">
          <span className="text-[14px] text-[hsl(45_30%_96%_/_0.8)]">Total de la commande</span>
          <span className="font-display text-[20px]">{eur(grand)} TTC</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/compte/commandes"
            className="inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[15px] font-bold text-white hover:bg-green-900"
          >
            Voir mes commandes
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex h-11 items-center rounded-[var(--radius-m)] px-5 text-[15px] font-bold text-[var(--text-brand)] shadow-[inset_0_0_0_1.5px_var(--green-900)] hover:bg-[var(--surface-sunken)]"
          >
            Retour au catalogue
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
