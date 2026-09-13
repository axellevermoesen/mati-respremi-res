import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  "brand" | "neutral" | "success" | "warning" | "danger" | "secondary"
> = {
  DRAFT: "neutral",
  PENDING: "warning",
  CONFIRMED: "brand",
  PREPARING: "brand",
  READY: "secondary",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Non réglée",
  PROCESSING: "Paiement en cours",
  PAID: "Payée",
  REFUNDED: "Remboursée",
  ON_INVOICE: "Sur facture",
};

/** Prochaine étape que le producteur peut déclencher (null si terminal). */
export function nextProducerStatus(s: OrderStatus): OrderStatus | null {
  switch (s) {
    case "PENDING":
      return "CONFIRMED";
    case "CONFIRMED":
      return "PREPARING";
    case "PREPARING":
      return "READY";
    case "READY":
      return "DELIVERED";
    default:
      return null;
  }
}

export const NEXT_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "",
  PENDING: "Confirmer la commande",
  CONFIRMED: "Passer en préparation",
  PREPARING: "Marquer comme prête",
  READY: "Marquer comme livrée",
  DELIVERED: "",
  CANCELLED: "",
};

export const ORDER_STEPS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
];
