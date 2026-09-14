import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

async function statusCounts(model: {
  count: (args: { where: { status: "DRAFT" | "SCHEDULED" | "PUBLISHED" } }) => Promise<number>;
}) {
  const [draft, scheduled, published] = await Promise.all([
    model.count({ where: { status: "DRAFT" } }),
    model.count({ where: { status: "SCHEDULED" } }),
    model.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { draft, scheduled, published };
}

export default async function AdminDashboardPage() {
  const [pages, articles, episodes, pendingAccounts] = await withRetry(() =>
    Promise.all([
      statusCounts(prisma.page),
      statusCounts(prisma.article),
      statusCounts(prisma.episode),
      prisma.user.count({ where: { status: "PENDING" } }),
    ]),
  );

  const rows = [
    { label: "Pages", href: "/admin/pages", ...pages },
    { label: "Articles", href: "/admin/articles", ...articles },
    { label: "Podcast", href: "/admin/podcasts", ...episodes },
  ];

  return (
    <div>
      <h1 className="font-display text-[28px] text-[var(--text-primary)]">Vue d&apos;ensemble</h1>
      <p className="mt-2 text-[14px] text-[var(--text-muted)]">
        La facturation n&apos;est pas encore branchée ici.
      </p>

      {pendingAccounts > 0 && (
        <Link
          href="/admin/comptes?role=Tous"
          className="mt-6 flex items-center justify-between rounded-[var(--radius-l)] bg-[hsl(28_60%_92%)] p-5 text-[hsl(28_60%_30%)] hover:bg-[hsl(28_60%_88%)]"
        >
          <span className="font-semibold">
            {pendingAccounts} compte(s) en attente de validation
          </span>
          <span>Voir →</span>
        </Link>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <Link
          href="/admin/comptes"
          className="flex items-center justify-between rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)] hover:shadow-[var(--shadow-l)]"
        >
          <div className="font-display text-[18px] text-[var(--text-primary)]">Comptes</div>
          <div className="text-[14px] text-[var(--text-muted)]">Producteurs, restaurateurs, revendeurs</div>
        </Link>
        {rows.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="flex items-center justify-between rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)] hover:shadow-[var(--shadow-l)]"
          >
            <div className="font-display text-[18px] text-[var(--text-primary)]">{r.label}</div>
            <div className="flex gap-8 text-[14px]">
              <span className="text-[var(--text-muted)]">{r.draft} brouillon(s)</span>
              <span className="text-[hsl(28_60%_45%)]">{r.scheduled} programmée(s)</span>
              <span className="text-green-700">{r.published} en ligne</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
