"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { cleanFormat, type SaleFormat, type SaleFormatInput } from "@/lib/formats";

type Ctx =
  | { error: string; producerId?: undefined }
  | { error?: undefined; producerId: string };

async function ctx(): Promise<Ctx> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi d'abord." };
  if (session.user.role !== "PRODUCER") {
    return { error: "Cet espace est réservé aux comptes producteur." };
  }
  const profile = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  );
  if (!profile) return { error: "Profil producteur introuvable." };
  return { producerId: profile.id };
}

/** "12,50 €" / "12.5" / 12.5 -> 12.5 ; jamais négatif. */
function toAmount(input?: string | number | null): number {
  if (input == null) return 0;
  const n =
    typeof input === "number"
      ? input
      : parseFloat(String(input).replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "produit";
  let slug = root;
  while (
    await withRetry(() =>
      prisma.product.findUnique({ where: { slug }, select: { id: true } }),
    )
  ) {
    slug = `${root}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

export async function createProduct(input: {
  name: string;
  category: string;
  unit: string;
  price: string;
  retailPrice?: string;
  vatRate?: string;
}): Promise<{ ok: true } | { error: string }> {
  const g = await ctx();
  if (!g.producerId) return { error: g.error ?? "Erreur." };

  const name = (input.name ?? "").trim();
  if (!name) return { error: "Le nom du produit est obligatoire." };
  const category = (input.category ?? "").trim() || "Autre";
  const unit = (input.unit ?? "").trim() || "pièce";
  const basePrice = toAmount(input.price);
  const retailPrice = input.retailPrice?.trim() ? toAmount(input.retailPrice) : null;

  try {
    const slug = await uniqueSlug(name);
    await withRetry(() =>
      prisma.product.create({
        data: {
          producerId: g.producerId,
          slug,
          name,
          category,
          unit,
          basePrice,
          retailPrice,
          vatRate: toVat(input.vatRate),
          isActive: true,
        },
        select: { id: true },
      }),
    );
    revalidatePath("/compte/produits");
    return { ok: true };
  } catch {
    return { error: "Création impossible (connexion instable). Réessaie dans un instant." };
  }
}

/** "5,5" / "20" -> nombre TVA valide, défaut 5.5. */
function toVat(input?: string | number | null): number {
  if (input == null) return 5.5;
  const n =
    typeof input === "number" ? input : parseFloat(String(input).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 5.5;
}

export async function updateProduct(
  id: string,
  patch: {
    name?: string;
    category?: string;
    unit?: string;
    price?: string;
    retailPrice?: string;
    isActive?: boolean;
    description?: string;
    vatRate?: string;
    formats?: SaleFormatInput[];
    stockMode?: string;
    stock?: string;
    stockUnit?: string;
  },
): Promise<{ ok: true } | { error: string }> {
  const g = await ctx();
  if (!g.producerId) return { error: g.error ?? "Erreur." };

  const owned = await withRetry(() =>
    prisma.product.findFirst({
      where: { id, producerId: g.producerId },
      select: { id: true },
    }),
  );
  if (!owned) return { error: "Produit introuvable." };

  const data: {
    name?: string;
    category?: string;
    unit?: string;
    basePrice?: number;
    retailPrice?: number | null;
    isActive?: boolean;
    description?: string | null;
    vatRate?: number;
    salesFormats?: Prisma.InputJsonValue;
    formats?: string | null;
    stockMode?: string;
    stock?: number;
    stockUnit?: string | null;
  } = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) return { error: "Le nom ne peut pas être vide." };
    data.name = n;
  }
  if (patch.category !== undefined) data.category = patch.category.trim() || "Autre";
  if (patch.unit !== undefined) data.unit = patch.unit.trim() || "pièce";
  if (patch.price !== undefined) data.basePrice = toAmount(patch.price);
  if (patch.retailPrice !== undefined) {
    data.retailPrice = patch.retailPrice.trim() ? toAmount(patch.retailPrice) : null;
  }
  if (patch.isActive !== undefined) data.isActive = patch.isActive;
  if (patch.description !== undefined) data.description = patch.description.trim() || null;
  if (patch.vatRate !== undefined) data.vatRate = toVat(patch.vatRate);

  if (patch.formats !== undefined) {
    const clean = patch.formats
      .map(cleanFormat)
      .filter((f): f is SaleFormat => f !== null);
    if (clean.length === 0) {
      return { error: "Ajoutez au moins un format de vente (avec un libellé)." };
    }
    data.salesFormats = clean as unknown as Prisma.InputJsonValue;
    // Le 1er format alimente le produit (compatibilité panier / catalogue / vitrine).
    data.basePrice = clean[0].pricePro;
    data.retailPrice = clean[0].priceRetail;
    data.formats = clean.map((f) => f.label).join(" · ") || null;
  }
  if (patch.stockMode !== undefined) {
    data.stockMode = patch.stockMode === "format" ? "format" : "global";
  }
  if (patch.stock !== undefined) data.stock = toAmount(patch.stock);
  if (patch.stockUnit !== undefined) data.stockUnit = patch.stockUnit.trim() || null;

  try {
    await withRetry(() =>
      prisma.product.update({ where: { id }, data, select: { id: true } }),
    );
    revalidatePath("/compte/produits");
    return { ok: true };
  } catch {
    return { error: "Modification impossible (connexion instable). Réessaie." };
  }
}

export async function deleteProduct(
  id: string,
): Promise<{ ok: true; softDeleted: boolean } | { error: string }> {
  const g = await ctx();
  if (!g.producerId) return { error: g.error ?? "Erreur." };

  const found = await withRetry(() =>
    prisma.product.findFirst({
      where: { id, producerId: g.producerId },
      select: { id: true, _count: { select: { orderItems: true } } },
    }),
  );
  if (!found) return { error: "Produit introuvable." };

  try {
    // Un produit déjà commandé ne peut pas être effacé (on garde l'historique) :
    // on le retire simplement de la vente.
    if (found._count.orderItems > 0) {
      await withRetry(() =>
        prisma.product.update({
          where: { id },
          data: { isActive: false },
          select: { id: true },
        }),
      );
      revalidatePath("/compte/produits");
      return { ok: true, softDeleted: true };
    }
    await withRetry(() => prisma.product.delete({ where: { id } }));
    revalidatePath("/compte/produits");
    return { ok: true, softDeleted: false };
  } catch {
    return { error: "Suppression impossible (connexion instable). Réessaie." };
  }
}

export async function renameCategory(
  from: string,
  to: string,
): Promise<{ ok: true; count: number } | { error: string }> {
  const g = await ctx();
  if (!g.producerId) return { error: g.error ?? "Erreur." };

  const target = (to ?? "").trim();
  if (!target) return { error: "Le nom de la catégorie ne peut pas être vide." };

  try {
    const res = await withRetry(() =>
      prisma.product.updateMany({
        where: { producerId: g.producerId, category: from },
        data: { category: target },
      }),
    );
    revalidatePath("/compte/produits");
    return { ok: true, count: res.count };
  } catch {
    return { error: "Renommage impossible (connexion instable). Réessaie." };
  }
}

type PriceMode = "retail" | "pro" | "none";

/**
 * Réglages « page publique » du catalogue :
 * - `visible` : le catalogue apparaît (ou non) sur la fiche producteur publique
 *   (stocké dans `sectionVisibility.produits.pub`, le même drapeau que Ma page).
 * - `priceMode` : quels prix afficher au grand public.
 */
export async function setPublicCatalogue(input: {
  visible?: boolean;
  priceMode?: PriceMode;
}): Promise<{ ok: true } | { error: string }> {
  const g = await ctx();
  if (!g.producerId) return { error: g.error ?? "Erreur." };

  const current = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { id: g.producerId },
      select: { sectionVisibility: true, slug: true },
    }),
  );
  if (!current) return { error: "Profil producteur introuvable." };

  const data: {
    sectionVisibility?: Record<string, { pro: boolean; pub: boolean }>;
    publicPriceMode?: string;
  } = {};

  if (input.visible !== undefined) {
    const vis =
      current.sectionVisibility && typeof current.sectionVisibility === "object"
        ? (current.sectionVisibility as Record<string, { pro?: boolean; pub?: boolean }>)
        : {};
    const merged: Record<string, { pro: boolean; pub: boolean }> = {};
    for (const [k, v] of Object.entries(vis)) {
      merged[k] = { pro: v?.pro ?? true, pub: v?.pub ?? true };
    }
    merged.produits = { pro: vis.produits?.pro ?? true, pub: input.visible };
    data.sectionVisibility = merged;
  }
  if (input.priceMode !== undefined) {
    data.publicPriceMode = input.priceMode;
  }

  try {
    await withRetry(() =>
      prisma.producerProfile.update({
        where: { id: g.producerId },
        data,
        select: { id: true },
      }),
    );
    revalidatePath("/compte/produits");
    if (current.slug) revalidatePath(`/producteurs/${current.slug}`);
    return { ok: true };
  } catch {
    return { error: "Enregistrement impossible (connexion instable). Réessaie." };
  }
}
