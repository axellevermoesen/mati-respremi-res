import type { TourStatus } from "@prisma/client";

export const TOUR_STATUS_LABEL: Record<TourStatus, string> = {
  PLANNED: "En préparation",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

export const TOUR_STATUS_TONE: Record<
  TourStatus,
  "brand" | "neutral" | "success" | "warning" | "danger" | "secondary"
> = {
  PLANNED: "warning",
  CONFIRMED: "brand",
  IN_PROGRESS: "secondary",
  DONE: "success",
  CANCELLED: "danger",
};

export const TOUR_STEPS: TourStatus[] = ["PLANNED", "CONFIRMED", "IN_PROGRESS", "DONE"];

export const NEXT_TOUR_LABEL: Record<TourStatus, string> = {
  PLANNED: "Confirmer la tournée",
  CONFIRMED: "Démarrer la tournée",
  IN_PROGRESS: "Clôturer la tournée",
  DONE: "",
  CANCELLED: "",
};

export function nextTourStatus(s: TourStatus): TourStatus | null {
  switch (s) {
    case "PLANNED":
      return "CONFIRMED";
    case "CONFIRMED":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "DONE";
    default:
      return null;
  }
}

/** Statuts de commande éligibles à une tournée. */
export const TOUR_ELIGIBLE_ORDER_STATUS = ["CONFIRMED", "PREPARING", "READY"] as const;
