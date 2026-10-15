import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { getHomeContent } from "@/lib/content-queries";
import { HomeEditor } from "./HomeEditor";

export const dynamic = "force-dynamic";

export default async function AdminAccueilPage() {
  const [content, producers, products, saved] = await Promise.all([
    getHomeContent(),
    withRetry(() =>
      prisma.producerProfile.findMany({
        where: { user: { status: "ACTIVE" } },
        orderBy: { farmName: "asc" },
        select: { id: true, farmName: true, coverUrl: true },
      }),
    ),
    withRetry(() =>
      prisma.product.findMany({
        where: { isActive: true, producer: { user: { status: "ACTIVE" } } },
        orderBy: [{ producer: { farmName: "asc" } }, { name: "asc" }],
        select: { id: true, name: true, photoUrl: true, producer: { select: { farmName: true } } },
      }),
    ),
    withRetry(() => prisma.siteContent.findUnique({ where: { key: "home" }, select: { updatedAt: true } })),
  ]);

  return (
    <div className="max-w-[880px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] text-[var(--text-primary)]">Page d&apos;accueil</h1>
          <p className="mt-2 text-[14px] text-[var(--text-muted)]">
            {saved
              ? `Dernière modification le ${saved.updatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.`
              : "Ce sont les textes d'origine : rien n'a encore été modifié ici."}
          </p>
        </div>
      </div>
      <HomeEditor
        initial={content}
        producers={producers.map((p) => ({ id: p.id, label: p.farmName, hasCover: !!p.coverUrl }))}
        products={products.map((p) => ({
          id: p.id,
          label: `${p.name} — ${p.producer.farmName}${p.photoUrl ? "" : " (sans photo)"}`,
        }))}
      />
    </div>
  );
}
