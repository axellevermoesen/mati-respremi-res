import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { computeSeoScore } from "@/lib/seo";
import type { Block } from "@/lib/content";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Programmé",
  PUBLISHED: "En ligne",
};
const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-[var(--sand-200)] text-[var(--text-secondary)]",
  SCHEDULED: "bg-[hsl(28_60%_88%)] text-[hsl(28_60%_30%)]",
  PUBLISHED: "bg-[hsl(150_25%_88%)] text-green-900",
};

export default async function AdminPagesListPage() {
  const pages = await withRetry(() => prisma.page.findMany({ orderBy: { updatedAt: "desc" } }));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] text-[var(--text-primary)]">Pages du site</h1>
          <p className="mt-2 text-[14px] text-[var(--text-muted)]">
            Les pages institutionnelles (à propos, FAQ, mentions légales…).
          </p>
        </div>
        <Link
          href="/admin/pages/nouveau"
          className="inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-semibold text-white hover:bg-green-900"
        >
          Nouvelle page
        </Link>
      </div>

      <div className="mt-7 overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)]">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              <th className="px-6 py-3">Titre</th>
              <th className="px-6 py-3">État</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">SEO</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const seo = computeSeoScore({
                title: p.title,
                metaTitle: p.metaTitle,
                metaDescription: p.metaDescription,
                body: p.body as unknown as Block[],
              });
              return (
                <tr key={p.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="font-semibold text-[var(--text-primary)] hover:underline"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">{p.excerpt}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] ${STATUS_CLASS[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)]">/{p.slug}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        seo.score >= 80
                          ? "text-green-700"
                          : seo.score >= 50
                            ? "text-[hsl(28_60%_45%)]"
                            : "text-[var(--state-danger)]"
                      }
                    >
                      {seo.score}/100
                    </span>
                  </td>
                </tr>
              );
            })}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-[var(--text-muted)]">
                  Aucune page pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
