import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import type { Block } from "@/lib/content";
import { ArticleEditor, type ArticleFormValues } from "../ArticleEditor";

function toLocalDateTimeInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditAdminArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await withRetry(() => prisma.article.findUnique({ where: { id } }));
  if (!article) notFound();

  const initial: ArticleFormValues = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    topic: article.topic,
    img: article.img,
    author: article.author,
    authorInitials: article.authorInitials,
    featured: article.featured,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    status: article.status,
    scheduledAt: toLocalDateTimeInput(article.scheduledAt),
    body: article.body as unknown as Block[],
  };

  return <ArticleEditor initial={initial} />;
}
