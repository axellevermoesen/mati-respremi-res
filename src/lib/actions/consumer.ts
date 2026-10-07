"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { changePasswordSchema, consumerSettingsSchema } from "@/lib/validation";

type Result = { ok: true } | { error: string };

async function currentConsumer() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CONSUMER") return null;
  return session.user.id;
}

/** « Mon compte » d'un particulier : identité, ville/rayon, mail du dimanche. */
export async function saveConsumerSettings(input: {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  radius: string;
  sundayMail: boolean;
}): Promise<Result> {
  const userId = await currentConsumer();
  if (!userId) return { error: "Réservé aux comptes particulier." };

  const parsed = consumerSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;
  const data = {
    firstName: d.firstName,
    lastName: d.lastName || null,
    phone: d.phone || null,
    city: d.city || null,
    radius: d.radius,
    sundayMail: d.sundayMail,
  };

  await withRetry(() =>
    prisma.user.update({
      where: { id: userId },
      data: {
        name: [d.firstName, d.lastName].filter(Boolean).join(" "),
        consumerProfile: { upsert: { create: data, update: data } },
      },
    }),
  );
  revalidatePath("/compte");
  revalidatePath("/compte/profil");
  return { ok: true };
}

export async function changeConsumerPassword(input: { current: string; next: string }): Promise<Result> {
  const userId = await currentConsumer();
  if (!userId) return { error: "Réservé aux comptes particulier." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const user = await withRetry(() =>
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
  );
  if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { error: "Le mot de passe actuel n'est pas le bon." };
  }
  const passwordHash = await bcrypt.hash(parsed.data.next, 10);
  await withRetry(() => prisma.user.update({ where: { id: userId }, data: { passwordHash } }));
  return { ok: true };
}

/** Supprime le compte particulier (abonnements et préférences partent avec, en cascade). */
export async function deleteConsumerAccount(): Promise<Result> {
  const userId = await currentConsumer();
  if (!userId) return { error: "Réservé aux comptes particulier." };
  await withRetry(() => prisma.user.delete({ where: { id: userId } }));
  await signOut({ redirectTo: "/" });
  return { ok: true };
}
