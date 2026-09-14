"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { createAccountSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

export type AccountActionState = { error?: string; tempPassword?: string } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Accès réservé à l'administration." } as const;
  }
  return { ok: true } as const;
}

/** Active, suspend ou remet en attente un compte. */
export async function setAccountStatus(
  userId: string,
  status: "PENDING" | "ACTIVE" | "SUSPENDED",
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  await withRetry(() => prisma.user.update({ where: { id: userId }, data: { status } }));
  revalidatePath("/admin/comptes");
  revalidatePath("/producteurs");
  revalidatePath("/catalogue");
  return {};
}

/**
 * Supprime définitivement un compte — refusé s'il a déjà des commandes (comme
 * producteur ou comme acheteur), pour ne jamais effacer un historique réel.
 * Dans ce cas, suspendre le compte est la bonne action.
 */
export async function deleteAccount(userId: string): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        producerProfile: { include: { _count: { select: { ordersReceived: true } } } },
        buyerProfile: { include: { _count: { select: { orders: true } } } },
      },
    }),
  );
  if (!user) return { error: "Compte introuvable." };

  const orderCount =
    (user.producerProfile?._count.ordersReceived ?? 0) + (user.buyerProfile?._count.orders ?? 0);
  if (orderCount > 0) {
    return {
      error: `Ce compte a ${orderCount} commande(s) liée(s) — impossible à supprimer sans perdre cet historique. Suspendez-le plutôt.`,
    };
  }

  await withRetry(() => prisma.user.delete({ where: { id: userId } }));
  revalidatePath("/admin/comptes");
  revalidatePath("/producteurs");
  return {};
}

/** Création manuelle d'un compte par l'admin (producteur ou acheteur), déjà actif. */
export async function createAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const ctx = await requireAdmin();
  if (ctx.error) return { error: ctx.error };

  const parsed = createAccountSchema.safeParse({
    role: formData.get("role"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { role, companyName, email } = parsed.data;

  const existing = await withRetry(() => prisma.user.findUnique({ where: { email }, select: { id: true } }));
  if (existing) return { error: "Un compte existe déjà avec cette adresse email." };

  const tempPassword = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  if (role === "PRODUCER") {
    const base = slugify(companyName);
    let slug = base;
    let n = 1;
    while (await withRetry(() => prisma.producerProfile.findUnique({ where: { slug }, select: { id: true } }))) {
      n += 1;
      slug = `${base}-${n}`;
    }
    await withRetry(() =>
      prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "PRODUCER",
          name: companyName,
          status: "ACTIVE",
          producerProfile: {
            create: { slug, farmName: companyName, description: "", practices: "", region: "" },
          },
        },
      }),
    );
  } else {
    await withRetry(() =>
      prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          name: companyName,
          status: "ACTIVE",
          buyerProfile: { create: { companyName, kind: role } },
        },
      }),
    );
  }

  revalidatePath("/admin/comptes");
  return { tempPassword };
}
