import Link from "next/link";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

const ROLE_LABEL: Record<string, string> = {
  PRODUCER: "Producteur",
  RESTAURANT: "Restaurateur",
  RESELLER: "Revendeur",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "À valider",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-[hsl(28_60%_88%)] text-[hsl(28_60%_30%)]",
  ACTIVE: "bg-[hsl(150_25%_88%)] text-green-900",
  SUSPENDED: "bg-[hsl(9_49%_88%)] text-[var(--state-danger)]",
};

const ROLES = ["Tous", "PRODUCER", "RESTAURANT", "RESELLER"] as const;

export default async function AdminComptesListPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const roleFilter = sp.role && ROLES.includes(sp.role as (typeof ROLES)[number]) ? sp.role : "Tous";

  const accounts = await withRetry(() =>
    prisma.user.findMany({
      where: {
        role:
          roleFilter === "Tous"
            ? { in: ["PRODUCER", "RESTAURANT", "RESELLER"] }
            : (roleFilter as Role),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        producerProfile: { select: { slug: true } },
      },
    }),
  );

  const pendingCount = accounts.filter((a) => a.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] text-[var(--text-primary)]">Comptes</h1>
          <p className="mt-2 text-[14px] text-[var(--text-muted)]">
            Les structures : producteurs, restaurateurs, revendeurs.
            {pendingCount > 0 && (
              <span className="ml-2 font-semibold text-[hsl(28_60%_45%)]">
                {pendingCount} en attente de validation
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/comptes/nouveau"
          className="inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-semibold text-white hover:bg-green-900"
        >
          Créer un compte
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <Link
            key={r}
            href={r === "Tous" ? "/admin/comptes" : `/admin/comptes?role=${r}`}
            className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[13px] font-semibold ${
              roleFilter === r
                ? "bg-green-900 text-white"
                : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--sand-200)]"
            }`}
          >
            {r === "Tous" ? "Tous" : ROLE_LABEL[r]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)]">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              <th className="px-6 py-3">Structure</th>
              <th className="px-6 py-3">Rôle</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Inscrit</th>
              <th className="px-6 py-3">État</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-[var(--border-subtle)] last:border-0">
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/comptes/${a.id}`}
                    className="font-semibold text-[var(--text-primary)] hover:underline"
                  >
                    {a.name || a.email}
                  </Link>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">{ROLE_LABEL[a.role] ?? a.role}</td>
                <td className="px-6 py-4 text-[var(--text-muted)]">{a.email}</td>
                <td className="px-6 py-4 text-[var(--text-muted)]">
                  {a.createdAt.toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[var(--text-muted)]">
                  Aucun compte dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
