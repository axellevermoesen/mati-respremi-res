/**
 * Formats de vente d'un produit ("tout en formats" : au moins un par produit).
 * Stockés en JSON sur `Product.salesFormats`. Le 1er format alimente
 * `basePrice` / `retailPrice` / `formats` (chaîne vitrine) du produit.
 */

export type SaleFormatInput = {
  id: string;
  label: string;
  size: string;
  sizeUnit: string;
  pricePro: string;
  priceRetail: string;
  unitPrice: string;
  stock: string;
};

export type SaleFormat = {
  id: string;
  label: string;
  size: number | null;
  sizeUnit: string;
  pricePro: number;
  priceRetail: number | null;
  unitPrice: number | null;
  stock: number | null;
};

export const SIZE_UNITS = ["g", "kg", "cl", "L", "mL", "pièce"];

export function toAmount(input?: string | number | null): number {
  if (input == null) return 0;
  const n =
    typeof input === "number"
      ? input
      : parseFloat(String(input).replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function optAmount(input?: string | number | null): number | null {
  if (input == null || String(input).trim() === "") return null;
  return toAmount(input);
}

/** Quantité d'un format ramenée à son unité de base : kg / L / pièce. */
export function baseQuantity(
  size: number | null,
  sizeUnit: string,
): { qty: number; base: "kg" | "L" | "pièce" } | null {
  if (!size || size <= 0) return null;
  const u = (sizeUnit || "").trim().toLowerCase();
  if (u === "g") return { qty: size / 1000, base: "kg" };
  if (u === "kg") return { qty: size, base: "kg" };
  if (u === "cl") return { qty: size / 100, base: "L" };
  if (u === "ml") return { qty: size / 1000, base: "L" };
  if (u === "l") return { qty: size, base: "L" };
  if (["pièce", "piece", "pc", "pcs", "unité", "unite", "u"].includes(u)) {
    return { qty: size, base: "pièce" };
  }
  return null;
}

/** Prix à l'unité (au kg / L / pièce) calculé à partir d'un prix de format. */
export function computedUnitPrice(
  price: number | null | undefined,
  size: number | null,
  sizeUnit: string,
): { value: number; base: "kg" | "L" | "pièce" } | null {
  if (price == null) return null;
  const b = baseQuantity(size, sizeUnit);
  if (!b) return null;
  return { value: price / b.qty, base: b.base };
}

/** Le prix à l'unité effectif : celui saisi, sinon le calculé. */
export function effectiveUnitPrice(
  f: Pick<SaleFormat, "unitPrice" | "pricePro" | "size" | "sizeUnit">,
): { value: number; base: string } | null {
  if (f.unitPrice != null) {
    const b = baseQuantity(f.size, f.sizeUnit);
    return { value: f.unitPrice, base: b?.base ?? (f.sizeUnit || "unité") };
  }
  return computedUnitPrice(f.pricePro, f.size, f.sizeUnit);
}

export function fmtMoney(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Entrée éditeur -> objet propre (ou null si pas de libellé). */
export function cleanFormat(f: SaleFormatInput): SaleFormat | null {
  const label = (f.label || "").trim();
  if (!label) return null;
  const sizeNum = f.size != null && String(f.size).trim() !== "" ? toAmount(f.size) : null;
  return {
    id: f.id || Math.random().toString(36).slice(2, 10),
    label,
    size: sizeNum && sizeNum > 0 ? sizeNum : null,
    sizeUnit: (f.sizeUnit || "").trim(),
    pricePro: toAmount(f.pricePro),
    priceRetail: optAmount(f.priceRetail),
    unitPrice: optAmount(f.unitPrice),
    stock: optAmount(f.stock),
  };
}

/** JSON stocké -> entrée éditeur (chaînes). */
export function toInput(f: Partial<SaleFormat> & { id?: string }): SaleFormatInput {
  const s = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    id: f.id || Math.random().toString(36).slice(2, 10),
    label: f.label ?? "",
    size: s(f.size ?? null),
    sizeUnit: f.sizeUnit ?? "",
    pricePro: s(f.pricePro ?? null),
    priceRetail: s(f.priceRetail ?? null),
    unitPrice: s(f.unitPrice ?? null),
    stock: s(f.stock ?? null),
  };
}
