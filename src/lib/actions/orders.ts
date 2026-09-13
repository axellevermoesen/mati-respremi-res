"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";
import { nextProducerStatus } from "@/lib/orders";

type OrderCtx =
  | { error: string; order?: undefined }
  | { error?: undefined; order: { id: string; status: OrderStatus } };

async function producerOwnedOrder(reference: string): Promise<OrderCtx> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PRODUCER") {
    return { error: "Action réservée au producteur." };
  }
  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: { reference, producer: { userId: session.user.id } },
      select: { id: true, status: true },
    }),
  );
  if (!order) return { error: "Commande introuvable." };
  return { order };
}

export async function advanceOrder(reference: string): Promise<{ error: string } | { ok: true }> {
  const g = await producerOwnedOrder(reference);
  if (!g.order) return { error: g.error ?? "Erreur." };
  const next = nextProducerStatus(g.order.status);
  if (!next) return { error: "Cette commande ne peut plus avancer." };
  await withRetry(() =>
    prisma.order.update({ where: { id: g.order.id }, data: { status: next } }),
  );
  revalidatePath(`/compte/commandes/${reference}`);
  revalidatePath("/compte/commandes");
  return { ok: true };
}

export async function cancelOrder(reference: string): Promise<{ error: string } | { ok: true }> {
  const g = await producerOwnedOrder(reference);
  if (!g.order) return { error: g.error ?? "Erreur." };
  if (g.order.status === "DELIVERED" || g.order.status === "CANCELLED") {
    return { error: "Cette commande ne peut plus être annulée." };
  }
  await withRetry(() =>
    prisma.order.update({ where: { id: g.order.id }, data: { status: "CANCELLED" } }),
  );
  revalidatePath(`/compte/commandes/${reference}`);
  revalidatePath("/compte/commandes");
  return { ok: true };
}
