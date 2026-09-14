"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { episodeSchema } from "@/lib/validation";

export type EpisodeActionState = { error?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Accès réservé à l'administration." } as const;
  }
  return { ok: true } as const;
}

function parseForm(formData: FormData) {
  return episodeSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    num: formData.get("num"),
    excerpt: formData.get("excerpt"),
    topic: formData.get("topic"),
    guest: formData.get("guest"),
    role: formData.get("role"),
    initials: formData.get("initials"),
    img: formData.get("img"),
    seconds: formData.get("seconds"),
    status: formData.get("status"),
    scheduledAt: formData.get("scheduledAt"),
  });
}

export async function createEpisode(
  _prev: EpisodeActionState,
  formData: FormData,
): Promise<EpisodeActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  const existing = await withRetry(() => prisma.episode.findUnique({ where: { slug: d.slug }, select: { id: true } }));
  if (existing) return { error: "Ce slug est déjà utilisé par un autre épisode." };

  const episode = await withRetry(() =>
    prisma.episode.create({
      data: {
        title: d.title,
        slug: d.slug,
        num: d.num,
        excerpt: d.excerpt,
        topic: d.topic,
        guest: d.guest,
        role: d.role,
        initials: d.initials,
        img: d.img,
        seconds: d.seconds,
        status: d.status,
        scheduledAt: d.status === "SCHEDULED" && d.scheduledAt ? new Date(d.scheduledAt) : null,
        publishedAt: d.status === "PUBLISHED" ? new Date() : null,
      },
    }),
  );

  revalidatePath("/podcast");
  revalidatePath("/blog");
  redirect(`/admin/podcasts/${episode.id}`);
}

export async function updateEpisode(
  id: string,
  _prev: EpisodeActionState,
  formData: FormData,
): Promise<EpisodeActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  const current = await withRetry(() => prisma.episode.findUnique({ where: { id } }));
  if (!current) return { error: "Épisode introuvable." };

  const slugTaken =
    d.slug !== current.slug &&
    (await withRetry(() => prisma.episode.findUnique({ where: { slug: d.slug }, select: { id: true } })));
  if (slugTaken) return { error: "Ce slug est déjà utilisé par un autre épisode." };

  await withRetry(() =>
    prisma.episode.update({
      where: { id },
      data: {
        title: d.title,
        slug: d.slug,
        num: d.num,
        excerpt: d.excerpt,
        topic: d.topic,
        guest: d.guest,
        role: d.role,
        initials: d.initials,
        img: d.img,
        seconds: d.seconds,
        status: d.status,
        scheduledAt: d.status === "SCHEDULED" && d.scheduledAt ? new Date(d.scheduledAt) : null,
        publishedAt: d.status === "PUBLISHED" ? (current.publishedAt ?? new Date()) : current.publishedAt,
      },
    }),
  );

  revalidatePath("/podcast");
  revalidatePath("/blog");
  revalidatePath(`/admin/podcasts/${id}`);
  return undefined;
}

export async function deleteEpisode(id: string): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  await withRetry(() => prisma.episode.delete({ where: { id } }));
  revalidatePath("/podcast");
  revalidatePath("/blog");
  revalidatePath("/admin/podcasts");
  return {};
}
