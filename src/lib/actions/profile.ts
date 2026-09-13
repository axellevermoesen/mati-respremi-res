"use server";

import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { slugify } from "@/lib/slug";
import {
  buyerProfileSchema,
  producerProfileSchema,
  type ProducerProfileInput,
} from "@/lib/validation";

export type ActionState = { error?: string } | undefined;

const KIND_MAP: Record<string, Role> = {
  restaurant: "RESTAURANT",
  epicerie: "RESELLER",
  autre: "RESTAURANT",
};

/** Enregistre / met à jour le profil acheteur depuis le formulaire d'inscription. */
export async function completeBuyerProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return {
      error: "Crée d'abord un compte sur la page Connexion, puis reviens compléter ton profil.",
    };
  }

  const parsed = buyerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  }
  const d = parsed.data;
  const userId = session.user.id;
  const kind = KIND_MAP[d.typeEtablissement];

  const contact2 = [
    [d.contact2Prenom, d.contact2Nom].filter(Boolean).join(" "),
    d.contact2Fonction,
    d.contact2Telephone,
    d.contact2Email,
  ]
    .filter(Boolean)
    .join(" · ");

  // Opérations séquentielles (pas de transaction interactive : le pooler
  // Supabase gratuit est trop lent, la transaction expirerait au bout de 5 s).
  const profileData = {
    companyName: d.structureNom,
    kind,
    siret: d.siret ?? null,
    phone: d.dirigeantTelephone ?? null,
    description: contact2 ? `Second contact : ${contact2}` : null,
  };

  try {
    await withRetry(() =>
      prisma.user.update({
        where: { id: userId },
        data: { name: `${d.dirigeantPrenom} ${d.dirigeantNom}` },
      }),
    );

    const profile = await withRetry(() =>
      prisma.buyerProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
      }),
    );

    if (d.adresse && d.ville && d.codePostal) {
      const existing = await withRetry(() =>
        prisma.deliveryAddress.findFirst({
          where: { buyerId: profile.id, isDefault: true },
          select: { id: true },
        }),
      );
      const addr = {
        label: "Adresse de livraison",
        line1: d.adresse,
        postcode: d.codePostal,
        city: d.ville,
        isDefault: true,
      };
      await withRetry(() =>
        existing
          ? prisma.deliveryAddress.update({ where: { id: existing.id }, data: addr })
          : prisma.deliveryAddress.create({ data: { ...addr, buyerId: profile.id } }),
      );
    }
  } catch {
    return {
      error: "L'enregistrement a échoué (connexion à la base instable). Réessaie dans un instant.",
    };
  }

  redirect("/compte");
}

function parseAmount(input?: string): number | null {
  if (!input) return null;
  const n = parseFloat(input.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Enregistre le profil producteur depuis le parcours d'inscription en 18 étapes.
 * Appelée directement (objet, pas FormData) — ne redirige pas : renvoie {ok} pour
 * que le formulaire affiche l'écran final.
 */
export async function completeProducerProfile(
  payload: ProducerProfileInput,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Connecte-toi d'abord, puis reviens compléter ton profil." };
  }
  if (session.user.role !== "PRODUCER") {
    return { error: "Ce parcours est réservé aux comptes producteur." };
  }

  const parsed = producerProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const d = parsed.data;
  const userId = session.user.id;

  const practices = [
    d.histoireAujourdhui,
    d.valeurs.length ? `Valeurs : ${d.valeurs.join(", ")}` : undefined,
    d.typeProduction ? `Production : ${d.typeProduction}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  const address = [d.adresse, d.codePostal, d.ville].filter(Boolean).join(", ") || undefined;
  const foundedYear = d.anneeCreation ? parseInt(d.anneeCreation, 10) || null : null;

  try {
    if (d.dirigeantPrenom || d.dirigeantNom) {
      await withRetry(() =>
        prisma.user.update({
          where: { id: userId },
          data: { name: [d.dirigeantPrenom, d.dirigeantNom].filter(Boolean).join(" ") },
        }),
      );
    }

    const profile = await withRetry(() =>
      prisma.producerProfile.update({
        where: { userId },
        data: {
          ...(d.structureNom ? { farmName: d.structureNom } : {}),
          tagline: d.tagline ?? null,
          description: d.histoireDebut ?? "",
          practices,
          certifications: d.certifications.length ? d.certifications.join(", ") : null,
          ...(d.region ? { region: d.region } : {}),
          address,
          foundedYear,
          minOrderValue: parseAmount(d.commandeMinimum),
        },
        select: { id: true },
      }),
    );

    // Vide puis recrée le catalogue soumis dans le parcours (idempotent).
    await withRetry(() => prisma.product.deleteMany({ where: { producerId: profile.id } }));

    const usedSlugs = new Set<string>();
    for (const p of d.produits) {
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
      await withRetry(() =>
        prisma.product.create({
          data: {
            producerId: profile.id,
            slug,
            name: p.nom,
            description: p.desc || null,
            category: p.cat || "Autre",
            unit: p.unite || "pièce",
            basePrice: parseAmount(p.prix) ?? 0,
            isActive: p.statut === "ligne",
          },
        }),
      );
    }
  } catch {
    return {
      error: "L'enregistrement a échoué (connexion à la base instable). Réessaie dans un instant.",
    };
  }

  return { ok: true };
}
