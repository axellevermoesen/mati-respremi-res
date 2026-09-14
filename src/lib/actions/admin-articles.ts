"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { articleSchema } from "@/lib/validation";

export type ArticleActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Accès réservé à l'administration." } as const;
  }
  return { ok: true } as const;
}

function parseForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    topic: formData.get("topic"),
    img: formData.get("img"),
    author: formData.get("author"),
    authorInitials: formData.get("authorInitials"),
    featured: formData.get("featured"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
    body: formData.get("body"),
  });
}

function revalidateArticlePaths(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function createArticle(
  _prev: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  const existing = await withRetry(() => prisma.article.findUnique({ where: { slug: d.slug }, select: { id: true } }));
  if (existing) return { error: "Ce slug est déjà utilisé par un autre article." };

  const article = await withRetry(() =>
    prisma.article.create({
      data: {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        topic: d.topic,
        img: d.img,
        author: d.author,
        authorInitials: d.authorInitials,
        featured: d.featured,
        metaTitle: d.metaTitle,
        metaDescription: d.metaDescription,
        status: d.status,
        scheduledAt: d.status === "SCHEDULED" && d.scheduledAt ? new Date(d.scheduledAt) : null,
        publishedAt: d.status === "PUBLISHED" ? new Date() : null,
        body: d.body as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  revalidateArticlePaths(d.slug);
  redirect(`/admin/articles/${article.id}`);
}

export async function updateArticle(
  id: string,
  _prev: ArticleActionState,
  formData: FormData,
): Promise<ArticleActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  const current = await withRetry(() => prisma.article.findUnique({ where: { id } }));
  if (!current) return { error: "Article introuvable." };

  const slugTaken =
    d.slug !== current.slug &&
    (await withRetry(() => prisma.article.findUnique({ where: { slug: d.slug }, select: { id: true } })));
  if (slugTaken) return { error: "Ce slug est déjà utilisé par un autre article." };

  await withRetry(() =>
    prisma.article.update({
      where: { id },
      data: {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        topic: d.topic,
        img: d.img,
        author: d.author,
        authorInitials: d.authorInitials,
        featured: d.featured,
        metaTitle: d.metaTitle,
        metaDescription: d.metaDescription,
        status: d.status,
        scheduledAt: d.status === "SCHEDULED" && d.scheduledAt ? new Date(d.scheduledAt) : null,
        publishedAt: d.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        body: d.body as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  revalidateArticlePaths(current.slug);
  if (d.slug !== current.slug) revalidateArticlePaths(d.slug);
  revalidatePath(`/admin/articles/${id}`);
  return undefined;
}

export async function deleteArticle(id: string): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const article = await withRetry(() => prisma.article.delete({ where: { id } }));
  revalidateArticlePaths(article.slug);
  revalidatePath("/admin/articles");
  return {};
}
