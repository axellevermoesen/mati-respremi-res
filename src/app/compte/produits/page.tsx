import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { ProductsManager } from "./ProductsManager";
import { toInput, type SaleFormat, type SaleFormatInput } from "@/lib/formats";

export const metadata: Metadata = { title: "Mes produits" };

export default async function ProduitsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");

  const profile = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, slug: true, sectionVisibility: true, publicPriceMode: true },
    }),
  );
  if (!profile) redirect("/inscription/producteur");

  const vis =
    profile.sectionVisibility && typeof profile.sectionVisibility === "object"
      ? (profile.sectionVisibility as Record<string, { pro?: boolean; pub?: boolean }>)
      : {};
  const publicVisible = vis.produits?.pub ?? true;

  const products = await withRetry(() =>
    prisma.product.findMany({
      where: { producerId: profile.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        basePrice: true,
        retailPrice: true,
        vatRate: true,
        description: true,
        photoUrl: true,
        isActive: true,
        salesFormats: true,
        stockMode: true,
        stock: true,
        stockUnit: true,
        _count: { select: { orderItems: true } },
      },
    }),
  );

  return (
    <ProductsManager
      slug={profile.slug}
      publicVisible={publicVisible}
      publicPriceMode={profile.publicPriceMode}
      products={products.map((p) => {
        const stored = Array.isArray(p.salesFormats)
          ? (p.salesFormats as unknown as Partial<SaleFormat>[])
          : [];
        const formats: SaleFormatInput[] =
          stored.length > 0
            ? stored.map(toInput)
            : [
                // Produit d'avant les formats : on en fabrique un à partir des champs existants.
                toInput({
                  label: p.unit || "Standard",
                  sizeUnit: p.unit || "",
                  pricePro: Number(p.basePrice),
                  priceRetail: p.retailPrice != null ? Number(p.retailPrice) : null,
                }),
              ];
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          price: String(p.basePrice),
          retailPrice: p.retailPrice != null ? String(p.retailPrice) : "",
          vatRate: String(p.vatRate),
          description: p.description ?? "",
          photoUrl: p.photoUrl ?? "",
          isActive: p.isActive,
          orders: p._count.orderItems,
          formats,
          stockMode: p.stockMode === "format" ? "format" : "global",
          stock: p.stock != null ? String(p.stock) : "",
          stockUnit: p.stockUnit ?? "",
        };
      })}
    />
  );
}
