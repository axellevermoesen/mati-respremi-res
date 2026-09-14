import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

/** Un contenu est visible s'il est en ligne, ou programmé et que la date est passée. */
function visibleWhere() {
  const now = new Date();
  return {
    OR: [{ status: "PUBLISHED" as const }, { status: "SCHEDULED" as const, scheduledAt: { lte: now } }],
  };
}

export async function getVisibleArticles() {
  return withRetry(() =>
    prisma.article.findMany({ where: visibleWhere(), orderBy: { publishedAt: "desc" } }),
  );
}

export async function getVisibleArticle(slug: string) {
  return withRetry(() =>
    prisma.article.findFirst({ where: { slug, ...visibleWhere() } }),
  );
}

export async function getVisibleEpisodes() {
  return withRetry(() =>
    prisma.episode.findMany({ where: visibleWhere(), orderBy: { publishedAt: "desc" } }),
  );
}
