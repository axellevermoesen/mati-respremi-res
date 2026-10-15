"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { resolveHome, type HomeContent } from "@/lib/home-content";
import { supabaseAdmin, PRODUCER_MEDIA_BUCKET } from "@/lib/supabase-admin";

type Result = { ok: true } | { error: string };

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/** Une adresse de lien acceptable : page du site (/…), ancre, web ou e-mail. */
function okHref(href: string) {
  return !href || /^(\/|#|https?:\/\/|mailto:)/.test(href);
}

/** Enregistre tout le contenu de la page d'accueil. */
export async function saveHomeContent(input: HomeContent): Promise<Result> {
  if (!(await isAdmin())) return { error: "Accès réservé à l'administration." };

  // Normalise (types, champs manquants) et coupe les textes trop longs.
  const data = resolveHome(input);
  const clip = (s: string, n = 600) => s.trim().slice(0, n);
  for (const link of [data.hero.primary, data.hero.secondary]) {
    link.label = clip(link.label, 60);
    link.href = clip(link.href, 300);
    if (!okHref(link.href)) {
      return { error: `Lien invalide : « ${link.href} ». Commencez par / (page du site) ou https://` };
    }
  }
  data.catalogue.productIds = data.catalogue.productIds.filter(Boolean).slice(0, 4);

  await withRetry(() =>
    prisma.siteContent.upsert({
      where: { key: "home" },
      create: { key: "home", data: data as unknown as Prisma.InputJsonValue },
      update: { data: data as unknown as Prisma.InputJsonValue },
    }),
  );
  revalidatePath("/");
  return { ok: true };
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Téléverse une image de la page d'accueil et renvoie son adresse (enregistrée au clic sur « Enregistrer »). */
export async function uploadHomeImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  if (!(await isAdmin())) return { error: "Accès réservé à l'administration." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier sélectionné." };
  if (!EXT[file.type]) return { error: "Formats acceptés : JPG, PNG, WebP, AVIF." };
  if (file.size > 6 * 1024 * 1024) return { error: "Image trop lourde (6 Mo maximum)." };

  const slot = String(formData.get("slot") ?? "image").replace(/[^a-z0-9-]/gi, "");
  const path = `site/home/${slot}-${new Date().getTime().toString(36)}.${EXT[file.type]}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(PRODUCER_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true, cacheControl: "3600" });
  if (error) return { error: "L'envoi de l'image a échoué. Réessayez dans un instant." };
  return { url: supabaseAdmin.storage.from(PRODUCER_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl };
}
