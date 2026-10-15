import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { resolveHome } from "@/lib/home-content";

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

/** Contenu de la page d'accueil (valeurs par défaut si rien n'est enregistré). */
export async function getHomeContent() {
  const row = await withRetry(() =>
    prisma.siteContent.findUnique({ where: { key: "home" } }),
  ).catch(() => null);
  return resolveHome(row?.data);
}
