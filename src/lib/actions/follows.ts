"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

type Result = { ok: true } | { error: string };

/** Particuliers et acheteurs pros peuvent suivre un producteur (pas les producteurs ni l'admin). */
async function currentFollower(): Promise<{ userId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Connectez-vous pour suivre un producteur." };
  const role = session.user.role;
  if (role !== "CONSUMER" && role !== "RESTAURANT" && role !== "RESELLER") {
    return { error: "Cette option est réservée aux particuliers et aux pros acheteurs." };
  }
  return { userId: session.user.id };
}

function refresh(slug?: string) {
  revalidatePath("/compte");
  revalidatePath("/compte/profil");
  if (slug) revalidatePath(`/producteurs/${slug}`);
}

export async function setFollow(producerId: string, follow: boolean): Promise<Result> {
  const g = await currentFollower();
  if (!g.userId) return { error: g.error ?? "Erreur." };
  const userId = g.userId;

  const producer = await withRetry(() =>
    prisma.producerProfile.findUnique({ where: { id: producerId }, select: { slug: true } }),
  );
  if (!producer) return { error: "Producteur introuvable." };

  if (follow) {
    await withRetry(() =>
      prisma.producerFollow.upsert({
        where: { userId_producerId: { userId, producerId } },
        create: { userId, producerId, notify: true },
        update: {},
      }),
    );
  } else {
    await withRetry(() => prisma.producerFollow.deleteMany({ where: { userId, producerId } }));
  }
  refresh(producer.slug);
  return { ok: true };
}

/** Inclure (ou non) ce producteur dans le mail du dimanche. */
export async function setFollowNotify(producerId: string, notify: boolean): Promise<Result> {
  const g = await currentFollower();
  if (!g.userId) return { error: g.error ?? "Erreur." };
  const { count } = await withRetry(() =>
    prisma.producerFollow.updateMany({ where: { userId: g.userId, producerId }, data: { notify } }),
  );
  if (!count) return { error: "Suivez d'abord ce producteur." };
  refresh();
  return { ok: true };
}
