"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { maPageSchema, type MaPageInput } from "@/lib/validation";

function parseAmount(input?: string): number | null {
  if (!input) return null;
  const n = parseFloat(input.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Le select "Délai de préparation" porte des heures ("24", "72"…) ; on stocke des jours. */
function leadTimeToDays(input?: string): number {
  const map: Record<string, number> = { "24": 1, "48": 2, "72": 3, "120": 5, "168": 7 };
  if (!input) return 2;
  if (map[input] !== undefined) return map[input];
  const n = parseInt(input, 10);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

type SavedProduct = {
  id: string;
  nom: string;
  detail: string;
  formats: string;
  prix: string;
  description: string;
  photoUrl: string;
};

/**
 * Sauvegarde de la page « Ma page » (éditeur du profil producteur).
 * Construit par tranches : on ajoute des rubriques au schéma au fil des versions.
 * Renvoie la liste des produits avec leurs ids (frais après création) pour que
 * le formulaire ne les recrée pas au prochain enregistrement.
 */
export async function saveProducerPage(
  payload: MaPageInput,
): Promise<{ ok: true; produits: SavedProduct[] } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi d'abord." };
  if (session.user.role !== "PRODUCER") {
    return { error: "Cette page est réservée aux comptes producteur." };
  }

  const parsed = maPageSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const d = parsed.data;

  try {
    const profile = await withRetry(() =>
      prisma.producerProfile.update({
        where: { userId: session.user.id },
        data: {
          farmName: d.farmName,
          productionType: d.productionType || null,
          tagline: d.tagline || null,
          region: d.region,
          city: d.city || null,
          description: d.histoire,
          values: d.valeurs.length ? d.valeurs.join(", ") : null,
          contacts: d.contacts,
          mapAddress: d.mapAddress || null,
          responseDelay: d.responseDelay || null,
          directMarkets: d.directMarkets,
          farmShopHours: d.farmShopHours || null,
          farmShopVisit: d.farmShopVisit || null,
          farmShopAddress: d.farmShopAddress || null,
          resellers: d.resellers,
          amaps: d.amaps,
          otherResellersMention: d.otherResellersMention,
          clients: d.clients,
          certifsList: d.certifs,
          certifications: d.certifs.length ? d.certifs.map((c) => c.nom).join(", ") : null,
          legalForm: d.legalForm || null,
          siret: d.siret || null,
          headcount: d.headcount || null,
          capacity: d.capacity || null,
          capacityUnit: d.capacityUnit || null,
          farmArea: d.farmArea || null,
          productionMode: d.productionMode || null,
          onSiteProcessing: d.onSiteProcessing || null,
          seasonality: d.seasonality || null,
          takeover: d.takeover || null,
          foundedYear: d.foundedYear ? parseInt(d.foundedYear, 10) || null : null,
          inventory: d.inventory,
          network: d.network,
          btobSettings: {
            visible: d.btobVisible,
            newRequests: d.btobNewRequests,
            manualConfirm: d.btobManualConfirm,
          },
          minOrderValue: parseAmount(d.minOrderValue),
          freeShippingFrom: parseAmount(d.freeShipping),
          leadTimeDays: leadTimeToDays(d.leadTime),
          deliveryRadius: d.deliveryRadius || null,
          deliveryDays: d.deliveryDays || null,
          orderCutoffTime: d.orderCutoffTime || null,
          sectionVisibility: d.visibility,
        },
        select: { id: true },
      }),
    );

    // --- Synchronisation du catalogue vitrine ---
    // Non destructif : « Ma page » met à jour la présentation des produits existants
    // (et peut en créer). L'ajout, le rangement par catégorie et la suppression se
    // font dans « Mes produits » (/compte/produits).
    const existing = await withRetry(() =>
      prisma.product.findMany({
        where: { producerId: profile.id },
        select: { id: true, slug: true, photoUrl: true },
      }),
    );

    const usedSlugs = new Set(existing.map((e) => e.slug));
    const saved: SavedProduct[] = [];
    for (const p of d.produits) {
      const data = {
        name: p.nom,
        detail: p.detail || null,
        formats: p.formats || null,
        description: p.description || null,
        basePrice: parseAmount(p.prix) ?? 0,
      };
      const existingRow = p.id ? existing.find((e) => e.id === p.id) : undefined;
      if (existingRow) {
        const row = await withRetry(() =>
          prisma.product.update({ where: { id: p.id }, data, select: { id: true } }),
        );
        saved.push({ id: row.id, ...toClient(p), photoUrl: existingRow.photoUrl ?? "" });
      } else {
        let slug = slugify(p.nom);
        while (
          usedSlugs.has(slug) ||
          (await withRetry(() =>
            prisma.product.findUnique({ where: { slug }, select: { id: true } }),
          ))
        ) {
          slug = `${slugify(p.nom)}-${Math.random().toString(36).slice(2, 6)}`;
        }
        usedSlugs.add(slug);
        const row = await withRetry(() =>
          prisma.product.create({
            data: {
              ...data,
              producerId: profile.id,
              slug,
              category: "Autre",
              unit: "pièce",
              isActive: true,
            },
            select: { id: true },
          }),
        );
        saved.push({ id: row.id, ...toClient(p), photoUrl: "" });
      }
    }

    return { ok: true, produits: saved };
  } catch {
    return {
      error: "L'enregistrement a échoué (connexion à la base instable). Réessaie dans un instant.",
    };
  }
}

function toClient(p: MaPageInput["produits"][number]) {
  return {
    nom: p.nom,
    detail: p.detail,
    formats: p.formats,
    prix: p.prix,
    description: p.description,
  };
}
