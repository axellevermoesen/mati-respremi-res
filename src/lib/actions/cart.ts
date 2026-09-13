"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

type BuyerCtx =
  | { error: string; buyer?: undefined }
  | { error?: undefined; buyer: { id: string; cart: { id: string } | null } };

async function currentBuyer(): Promise<BuyerCtx> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi pour utiliser le panier." };
  if (session.user.role !== "RESTAURANT" && session.user.role !== "RESELLER") {
    return { error: "Le panier est réservé aux comptes acheteur." };
  }
  const buyer = await withRetry(() =>
    prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, cart: { select: { id: true } } },
    }),
  );
  if (!buyer) return { error: "Profil acheteur introuvable." };
  return { buyer };
}

async function ensureCart(buyerId: string, cartId?: string) {
  if (cartId) return cartId;
  const cart = await withRetry(() =>
    prisma.cart.upsert({
      where: { buyerId },
      create: { buyerId },
      update: {},
      select: { id: true },
    }),
  );
  return cart.id;
}

export async function addToCart(productId: string, quantity = 1) {
  const g = await currentBuyer();
  if (!g.buyer) return { error: g.error ?? "Erreur." };
  const qty = Math.max(1, Math.min(999, Math.round(quantity)));

  const product = await withRetry(() =>
    prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true },
    }),
  );
  if (!product) return { error: "Ce produit n'est plus disponible." };

  const cartId = await ensureCart(g.buyer.id, g.buyer.cart?.id);
  await withRetry(() =>
    prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity: qty },
      update: { quantity: { increment: qty } },
    }),
  );
  revalidatePath("/panier");
  return { ok: true };
}

export async function setCartQuantity(itemId: string, quantity: number) {
  const g = await currentBuyer();
  if (!g.buyer) return { error: g.error ?? "Erreur." };
  const item = await withRetry(() =>
    prisma.cartItem.findFirst({
      where: { id: itemId, cart: { buyerId: g.buyer.id } },
      select: { id: true },
    }),
  );
  if (!item) return { error: "Article introuvable." };

  if (quantity <= 0) {
    await withRetry(() => prisma.cartItem.delete({ where: { id: itemId } }));
  } else {
    await withRetry(() =>
      prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: Math.min(999, Math.round(quantity)) },
      }),
    );
  }
  revalidatePath("/panier");
  return { ok: true };
}

export async function removeCartItem(itemId: string) {
  return setCartQuantity(itemId, 0);
}

export async function addDeliveryAddress(formData: FormData): Promise<{ error: string } | void> {
  const g = await currentBuyer();
  if (!g.buyer) return { error: g.error ?? "Erreur." };
  const label = String(formData.get("label") ?? "").trim() || "Livraison";
  const line1 = String(formData.get("line1") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!line1 || !postcode || !city) {
    return { error: "Adresse, code postal et ville sont requis." };
  }
  const count = await withRetry(() =>
    prisma.deliveryAddress.count({ where: { buyerId: g.buyer.id } }),
  );
  await withRetry(() =>
    prisma.deliveryAddress.create({
      data: {
        buyerId: g.buyer.id,
        label,
        line1,
        postcode,
        city,
        notes: notes || null,
        isDefault: count === 0,
      },
    }),
  );
  revalidatePath("/panier");
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export async function checkout(formData: FormData): Promise<{ error: string } | void> {
  const g = await currentBuyer();
  if (!g.buyer) return { error: g.error ?? "Erreur." };
  const addressId = String(formData.get("addressId") ?? "");

  const address = await withRetry(() =>
    prisma.deliveryAddress.findFirst({
      where: { id: addressId, buyerId: g.buyer.id },
      select: { id: true },
    }),
  );
  if (!address) return { error: "Choisis une adresse de livraison." };

  const cart = await withRetry(() =>
    prisma.cart.findUnique({
      where: { buyerId: g.buyer.id },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                basePrice: true,
                vatRate: true,
                isActive: true,
                producer: {
                  select: { id: true, farmName: true, minOrderValue: true, leadTimeDays: true },
                },
              },
            },
          },
        },
      },
    }),
  );
  if (!cart || cart.items.length === 0) return { error: "Votre panier est vide." };

  // Regroupement par producteur
  type Line = (typeof cart.items)[number];
  const groups = new Map<string, { producer: Line["product"]["producer"]; lines: Line[] }>();
  for (const it of cart.items) {
    if (!it.product.isActive) continue;
    const key = it.product.producer.id;
    if (!groups.has(key)) groups.set(key, { producer: it.product.producer, lines: [] });
    groups.get(key)!.lines.push(it);
  }
  if (groups.size === 0) return { error: "Votre panier est vide." };

  // Vérif du minimum de commande par producteur
  for (const { producer, lines } of groups.values()) {
    const sub = lines.reduce(
      (s, l) => s + Number(l.product.basePrice) * l.quantity,
      0,
    );
    const min = producer.minOrderValue ? Number(producer.minOrderValue) : 0;
    if (min > 0 && sub < min) {
      return {
        error: `Le minimum de commande de ${producer.farmName} (${min.toLocaleString(
          "fr-FR",
        )} € HT) n'est pas atteint.`,
      };
    }
  }

  const year = new Date().getFullYear();
  const startCount = await withRetry(() =>
    prisma.order.count({ where: { reference: { startsWith: `MP-${year}-` } } }),
  );

  const created: string[] = [];
  let seq = startCount;
  try {
    for (const { producer, lines } of groups.values()) {
      seq += 1;
      const reference = `MP-${year}-${String(seq).padStart(6, "0")}`;
      let subtotal = 0;
      let vatTotal = 0;
      const itemsData = lines.map((l) => {
        const unitPrice = Number(l.product.basePrice);
        const lineHT = money(unitPrice * l.quantity);
        const lineVat = money(lineHT * (Number(l.product.vatRate) / 100));
        subtotal = money(subtotal + lineHT);
        vatTotal = money(vatTotal + lineVat);
        return {
          productId: l.product.id,
          name: l.product.name,
          unit: l.product.unit,
          quantity: l.quantity,
          unitPrice,
          vatRate: l.product.vatRate,
          lineTotal: lineHT,
        };
      });
      await withRetry(() =>
        prisma.order.create({
          data: {
            reference,
            buyerId: g.buyer.id,
            producerId: producer.id,
            status: "PENDING",
            paymentStatus: "ON_INVOICE",
            deliveryMode: "DELIVERY",
            deliveryAddressId: addressId,
            deliveryFee: 0,
            subtotal,
            vatTotal,
            total: money(subtotal + vatTotal),
            items: { create: itemsData },
          },
        }),
      );
      created.push(reference);
    }
    await withRetry(() => prisma.cartItem.deleteMany({ where: { cartId: cart.id } }));
  } catch {
    return { error: "La validation a échoué (connexion instable). Réessaie dans un instant." };
  }

  revalidatePath("/panier");
  redirect(`/panier/confirmation?refs=${created.join(",")}`);
}
