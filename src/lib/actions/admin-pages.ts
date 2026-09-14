"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { pageSchema } from "@/lib/validation";

export type PageActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Accès réservé à l'administration." } as const;
  }
  return { userId: session.user.id } as const;
}

function revalidatePublicPage(slug: string) {
  revalidatePath(`/${slug}`);
}

export async function createPage(_prev: PageActionState, formData: FormData): Promise<PageActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = pageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { title, slug, excerpt, metaTitle, metaDescription, status, scheduledAt, body } = parsed.data;

  const existing = await withRetry(() => prisma.page.findUnique({ where: { slug }, select: { id: true } }));
  if (existing) return { error: "Ce slug est déjà utilisé par une autre page." };

  const page = await withRetry(() =>
    prisma.page.create({
      data: {
        title,
        slug,
        excerpt,
        metaTitle,
        metaDescription,
        status,
        scheduledAt: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        body: body as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  revalidatePublicPage(slug);
  redirect(`/admin/pages/${page.id}`);
}

export async function updatePage(
  id: string,
  _prev: PageActionState,
  formData: FormData,
): Promise<PageActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = pageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { title, slug, excerpt, metaTitle, metaDescription, status, scheduledAt, body } = parsed.data;

  const current = await withRetry(() => prisma.page.findUnique({ where: { id } }));
  if (!current) return { error: "Page introuvable." };

  const slugTaken =
    slug !== current.slug &&
    (await withRetry(() => prisma.page.findUnique({ where: { slug }, select: { id: true } })));
  if (slugTaken) return { error: "Ce slug est déjà utilisé par une autre page." };

  await withRetry(() =>
    prisma.page.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        metaTitle,
        metaDescription,
        status,
        scheduledAt: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : null,
        publishedAt:
          status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        body: body as unknown as Prisma.InputJsonValue,
      },
    }),
  );

  revalidatePublicPage(current.slug);
  if (slug !== current.slug) revalidatePublicPage(slug);
  revalidatePath(`/admin/pages/${id}`);
  return undefined;
}

export async function deletePage(id: string): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const page = await withRetry(() => prisma.page.delete({ where: { id } }));
  revalidatePublicPage(page.slug);
  revalidatePath("/admin/pages");
  return {};
}
