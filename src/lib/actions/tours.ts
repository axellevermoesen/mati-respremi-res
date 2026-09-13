"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { nextTourStatus, TOUR_ELIGIBLE_ORDER_STATUS } from "@/lib/tours";

type ProdCtx =
  | { error: string; producer?: undefined }
  | { error?: undefined; producer: { id: string; region: string } };

async function currentProducer(): Promise<ProdCtx> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PRODUCER") {
    return { error: "Réservé aux comptes producteur." };
  }
  const producer = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, region: true },
    }),
  );
  if (!producer) return { error: "Profil producteur introuvable." };
  return { producer: { id: producer.id, region: producer.region } };
}

function revalidateTour(id: string) {
  revalidatePath("/compte/tournees");
  revalidatePath(`/compte/tournees/${id}`);
}

export async function createTour(formData: FormData): Promise<{ error: string } | void> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const dateStr = String(formData.get("date") ?? "");
  const date = new Date(dateStr);
  if (!dateStr || Number.isNaN(date.getTime())) return { error: "Choisis une date valide." };
  const notes = String(formData.get("notes") ?? "").trim();

  let tourId: string;
  try {
    const tour = await withRetry(() =>
      prisma.deliveryTour.create({
        data: {
          date,
          region: g.producer.region || "—",
          notes: notes || null,
          driverProducerId: g.producer.id,
          stops: { create: { producerId: g.producer.id } },
        },
        select: { id: true },
      }),
    );
    tourId = tour.id;
  } catch {
    return { error: "La création a échoué (connexion instable). Réessaie." };
  }
  revalidatePath("/compte/tournees");
  redirect(`/compte/tournees/${tourId}`);
}

export async function joinTour(tourId: string): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const tour = await withRetry(() =>
    prisma.deliveryTour.findUnique({
      where: { id: tourId },
      select: { id: true, region: true, status: true },
    }),
  );
  if (!tour) return { error: "Tournée introuvable." };
  if (tour.status !== "PLANNED" && tour.status !== "CONFIRMED") {
    return { error: "Cette tournée n'accepte plus de participants." };
  }
  await withRetry(() =>
    prisma.deliveryTourStop.upsert({
      where: { tourId_producerId: { tourId, producerId: g.producer.id } },
      create: { tourId, producerId: g.producer.id },
      update: {},
    }),
  );
  revalidateTour(tourId);
  return { ok: true };
}

export async function leaveTour(tourId: string): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const stop = await withRetry(() =>
    prisma.deliveryTourStop.findUnique({
      where: { tourId_producerId: { tourId, producerId: g.producer.id } },
      select: { id: true },
    }),
  );
  if (!stop) return { error: "Vous ne participez pas à cette tournée." };
  await withRetry(() =>
    prisma.order.updateMany({ where: { tourStopId: stop.id }, data: { tourStopId: null } }),
  );
  await withRetry(() => prisma.deliveryTourStop.delete({ where: { id: stop.id } }));
  await withRetry(() =>
    prisma.deliveryTour.updateMany({
      where: { id: tourId, driverProducerId: g.producer.id },
      data: { driverProducerId: null },
    }),
  );
  revalidateTour(tourId);
  return { ok: true };
}

export async function addOrdersToTour(
  tourId: string,
  orderIds: string[],
): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const stop = await withRetry(() =>
    prisma.deliveryTourStop.findUnique({
      where: { tourId_producerId: { tourId, producerId: g.producer.id } },
      select: { id: true },
    }),
  );
  if (!stop) return { error: "Rejoignez d'abord la tournée." };

  const result = await withRetry(() =>
    prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        producerId: g.producer.id,
        tourStopId: null,
        status: { in: [...TOUR_ELIGIBLE_ORDER_STATUS] },
      },
      data: { tourStopId: stop.id },
    }),
  );
  revalidateTour(tourId);
  if (result.count === 0) return { error: "Aucune commande éligible n'a été ajoutée." };
  return { ok: true };
}

export async function removeOrderFromTour(
  orderId: string,
): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const order = await withRetry(() =>
    prisma.order.findFirst({
      where: { id: orderId, producerId: g.producer.id },
      select: { id: true, tourStop: { select: { tourId: true } } },
    }),
  );
  if (!order) return { error: "Commande introuvable." };
  await withRetry(() =>
    prisma.order.update({ where: { id: orderId }, data: { tourStopId: null } }),
  );
  if (order.tourStop) revalidateTour(order.tourStop.tourId);
  return { ok: true };
}

export async function setTourDriver(
  tourId: string,
  driverProducerId: string,
): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const iAmIn = await withRetry(() =>
    prisma.deliveryTourStop.findUnique({
      where: { tourId_producerId: { tourId, producerId: g.producer.id } },
      select: { id: true },
    }),
  );
  if (!iAmIn) return { error: "Vous ne participez pas à cette tournée." };
  const driverIn = await withRetry(() =>
    prisma.deliveryTourStop.findUnique({
      where: { tourId_producerId: { tourId, producerId: driverProducerId } },
      select: { id: true },
    }),
  );
  if (!driverIn) return { error: "Ce producteur ne participe pas à la tournée." };
  await withRetry(() =>
    prisma.deliveryTour.update({ where: { id: tourId }, data: { driverProducerId } }),
  );
  revalidateTour(tourId);
  return { ok: true };
}

export async function advanceTour(tourId: string): Promise<{ error: string } | { ok: true }> {
  const g = await currentProducer();
  if (!g.producer) return { error: g.error ?? "Erreur." };
  const tour = await withRetry(() =>
    prisma.deliveryTour.findFirst({
      where: { id: tourId, stops: { some: { producerId: g.producer.id } } },
      select: { id: true, status: true },
    }),
  );
  if (!tour) return { error: "Tournée introuvable ou vous n'y participez pas." };
  const next = nextTourStatus(tour.status);
  if (!next) return { error: "Cette tournée est déjà terminée." };
  await withRetry(() =>
    prisma.deliveryTour.update({ where: { id: tourId }, data: { status: next } }),
  );
  // Quand la tournée est clôturée, les commandes livrées passent en DELIVERED
  if (next === "DONE") {
    await withRetry(() =>
      prisma.order.updateMany({
        where: { tourStop: { tourId }, status: { not: "CANCELLED" } },
        data: { status: "DELIVERED" },
      }),
    );
  }
  revalidateTour(tourId);
  return { ok: true };
}
