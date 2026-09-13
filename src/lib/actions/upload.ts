"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { supabaseAdmin, PRODUCER_MEDIA_BUCKET } from "@/lib/supabase-admin";

const MAX_BYTES = 6 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type Result = { url: string } | { error: string };

type ProducerCtx =
  | { error: string; profile?: undefined }
  | { error?: undefined; profile: { id: string; mediaUrls: unknown } };

async function currentProducer(): Promise<ProducerCtx> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi d'abord." };
  if (session.user.role !== "PRODUCER") {
    return { error: "Réservé aux comptes producteur." };
  }
  const profile = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, mediaUrls: true },
    }),
  );
  if (!profile) return { error: "Profil producteur introuvable." };
  return { profile };
}

async function putObject(path: string, file: File): Promise<Result> {
  if (!EXT[file.type]) return { error: "Formats acceptés : JPG, PNG, WebP, AVIF." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (6 Mo maximum)." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(PRODUCER_MEDIA_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true, cacheControl: "3600" });
  if (error) return { error: "L'envoi de l'image a échoué. Réessaie dans un instant." };
  const { data } = supabaseAdmin.storage.from(PRODUCER_MEDIA_BUCKET).getPublicUrl(path);
  // suffixe anti-cache : après un remplacement, le navigateur recharge la nouvelle image
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

/**
 * Téléverse une image producteur et la rattache au bon endroit.
 * `kind` : "cover" | "logo" | "product" | "media"
 * pour "product" : `productId` requis ; pour "media" : `slot` (0-4).
 */
export async function uploadProducerImage(formData: FormData): Promise<Result> {
  const g = await currentProducer();
  if (!g.profile) return { error: g.error ?? "Erreur." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucun fichier sélectionné." };
  const kind = String(formData.get("kind") ?? "");
  const ext = EXT[file.type] ?? "jpg";
  const base = `producers/${g.profile.id}`;

  if (kind === "cover" || kind === "logo") {
    const r = await putObject(`${base}/${kind}.${ext}`, file);
    if ("error" in r) return r;
    await withRetry(() =>
      prisma.producerProfile.update({
        where: { id: g.profile.id },
        data: kind === "cover" ? { coverUrl: r.url } : { logoUrl: r.url },
      }),
    );
    return r;
  }

  if (kind === "product") {
    const productId = String(formData.get("productId") ?? "");
    const product = await withRetry(() =>
      prisma.product.findFirst({
        where: { id: productId, producerId: g.profile.id },
        select: { id: true },
      }),
    );
    if (!product) return { error: "Produit introuvable." };
    const r = await putObject(`${base}/products/${productId}.${ext}`, file);
    if ("error" in r) return r;
    await withRetry(() =>
      prisma.product.update({ where: { id: productId }, data: { photoUrl: r.url } }),
    );
    return r;
  }

  if (kind === "media") {
    const slot = Math.max(0, Math.min(4, Number(formData.get("slot") ?? 0)));
    const r = await putObject(`${base}/media/${slot}.${ext}`, file);
    if ("error" in r) return r;
    const list = Array.isArray(g.profile.mediaUrls) ? [...(g.profile.mediaUrls as string[])] : [];
    list[slot] = r.url;
    await withRetry(() =>
      prisma.producerProfile.update({
        where: { id: g.profile.id },
        data: { mediaUrls: list },
      }),
    );
    return r;
  }

  return { error: "Type d'image inconnu." };
}

/** Retire la référence à une image (l'objet reste dans le stockage, écrasé au prochain envoi). */
export async function removeProducerImage(
  kind: "cover" | "logo" | "product" | "media",
  ref?: string,
): Promise<{ ok: true } | { error: string }> {
  const g = await currentProducer();
  if (!g.profile) return { error: g.error ?? "Erreur." };

  if (kind === "cover" || kind === "logo") {
    await withRetry(() =>
      prisma.producerProfile.update({
        where: { id: g.profile.id },
        data: kind === "cover" ? { coverUrl: null } : { logoUrl: null },
      }),
    );
    return { ok: true };
  }
  if (kind === "product" && ref) {
    const product = await withRetry(() =>
      prisma.product.findFirst({
        where: { id: ref, producerId: g.profile.id },
        select: { id: true },
      }),
    );
    if (!product) return { error: "Produit introuvable." };
    await withRetry(() => prisma.product.update({ where: { id: ref }, data: { photoUrl: null } }));
    return { ok: true };
  }
  if (kind === "media" && ref !== undefined) {
    const slot = Number(ref);
    const list = Array.isArray(g.profile.mediaUrls) ? [...(g.profile.mediaUrls as string[])] : [];
    list[slot] = "";
    await withRetry(() =>
      prisma.producerProfile.update({
        where: { id: g.profile.id },
        data: { mediaUrls: list },
      }),
    );
    return { ok: true };
  }
  return { error: "Type d'image inconnu." };
}
