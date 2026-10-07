"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { postSchema, type PostInput } from "@/lib/validation";

type Ctx = { error: string; producer?: undefined } | { error?: undefined; producer: { id: string; slug: string } };

async function currentProducer(): Promise<Ctx> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi d'abord." };
  if (session.user.role !== "PRODUCER") return { error: "Réservé aux comptes producteur." };
  const producer = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, slug: true },
    }),
  );
  if (!producer) return { error: "Profil producteur introuvable." };
  return { producer };
}

function refresh(slug: string) {
  revalidatePath("/compte/actus");
  revalidatePath("/compte");
  revalidatePath(`/producteurs/${slug}`);
}

/** Publie une actu pour les pros, les particuliers, ou les deux. */
export async function createPost(input: PostInput): Promise<{ ok: true } | { error: string }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;
  const orNull = (s?: string) => (s ? s : null);

  try {
    await withRetry(() =>
      prisma.producerPost.create({
        data: {
          producerId: g.producer.id,
          kind: d.kind,
          title: d.title,
          body: d.body,
          // Un texte « pros » n'a de sens que si l'actu va aussi aux pros.
          bodyPro: d.forPros ? orNull(d.bodyPro) : null,
          imageUrl: orNull(d.imageUrl),
          forPros: d.forPros,
          forPublic: d.forPublic,
          eventDate:
            d.kind === "EVENT" && /^\d{4}-\d{2}-\d{2}$/.test(d.eventDate)
              ? new Date(`${d.eventDate}T12:00:00Z`)
              : null,
          eventTime: d.kind === "EVENT" ? orNull(d.eventTime) : null,
          eventPlace: d.kind === "EVENT" ? orNull(d.eventPlace) : null,
          productName: d.kind === "PRODUCT" ? orNull(d.productName) : null,
          productNote: d.kind === "PRODUCT" ? orNull(d.productNote) : null,
          restaurantName: d.kind === "RESTAURANT" ? orNull(d.restaurantName) : null,
          restaurantPlace: d.kind === "RESTAURANT" ? orNull(d.restaurantPlace) : null,
        },
      }),
    );
  } catch {
    return { error: "La publication a échoué (connexion à la base instable). Réessaie dans un instant." };
  }

  refresh(g.producer.slug);
  return { ok: true };
}

export async function deletePost(id: string): Promise<{ ok: true } | { error: string }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const { count } = await withRetry(() =>
    prisma.producerPost.deleteMany({ where: { id, producerId: g.producer.id } }),
  );
  if (!count) return { error: "Actu introuvable." };
  refresh(g.producer.slug);
  return { ok: true };
}
