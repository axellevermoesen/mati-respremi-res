import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { MaPageForm } from "./MaPageForm";

export const metadata: Metadata = { title: "Ma page" };

type ContactLine = { label: string; value: string; pro: boolean; pub: boolean };
type MarketRow = { nom: string; jour: string; lieu: string };
type ResellerRow = { nom: string; type: string; ville: string; origine: "plateforme" | "hors" };
type AmapRow = { nom: string; detail: string; origine: "plateforme" | "hors" };
type ClientRow = { nom: string; role: string; produit: string };
type CertifRow = { nom: string; annee: string; perso: boolean; lien: string };
type InventoryRow = { poste: string; quantite: string; precision: string };
type NetworkRow = {
  nom: string;
  role: string;
  groupe: "partenaire" | "recommande";
  mot: string;
};
type BtobSettings = { visible?: boolean; newRequests?: boolean; manualConfirm?: boolean };

export default async function MaPageSettings() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");

  const profile = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        farmName: true,
        productionType: true,
        tagline: true,
        region: true,
        city: true,
        description: true,
        values: true,
        contacts: true,
        mapAddress: true,
        responseDelay: true,
        directMarkets: true,
        farmShopHours: true,
        farmShopVisit: true,
        farmShopAddress: true,
        resellers: true,
        amaps: true,
        otherResellersMention: true,
        clients: true,
        certifsList: true,
        legalForm: true,
        siret: true,
        headcount: true,
        capacity: true,
        capacityUnit: true,
        farmArea: true,
        productionMode: true,
        onSiteProcessing: true,
        seasonality: true,
        takeover: true,
        foundedYear: true,
        inventory: true,
        network: true,
        btobSettings: true,
        minOrderValue: true,
        freeShippingFrom: true,
        leadTimeDays: true,
        deliveryRadius: true,
        deliveryDays: true,
        orderCutoffTime: true,
        sectionVisibility: true,
        slug: true,
        coverUrl: true,
        logoUrl: true,
        mediaUrls: true,
        products: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            detail: true,
            formats: true,
            basePrice: true,
            description: true,
            photoUrl: true,
          },
        },
      },
    }),
  );
  if (!profile) redirect("/compte");

  return (
    <MaPageForm
      slug={profile.slug}
      initial={{
        farmName: profile.farmName ?? "",
        productionType: profile.productionType ?? "",
        tagline: profile.tagline ?? "",
        region: profile.region ?? "",
        city: profile.city ?? "",
        histoire: profile.description ?? "",
        valeurs: profile.values
          ? profile.values.split(",").map((v) => v.trim()).filter(Boolean)
          : [],
        contacts: (profile.contacts as ContactLine[] | null) ?? [],
        mapAddress: profile.mapAddress ?? "",
        responseDelay: profile.responseDelay ?? "",
        directMarkets: (profile.directMarkets as MarketRow[] | null) ?? [],
        farmShopHours: profile.farmShopHours ?? "",
        farmShopVisit: profile.farmShopVisit ?? "",
        farmShopAddress: profile.farmShopAddress ?? "",
        resellers: (profile.resellers as ResellerRow[] | null) ?? [],
        amaps: (profile.amaps as AmapRow[] | null) ?? [],
        otherResellersMention: profile.otherResellersMention ?? false,
        clients: (profile.clients as ClientRow[] | null) ?? [],
        certifs: (profile.certifsList as CertifRow[] | null) ?? [],
        legalForm: profile.legalForm ?? "",
        siret: profile.siret ?? "",
        headcount: profile.headcount ?? "",
        capacity: profile.capacity ?? "",
        capacityUnit: profile.capacityUnit ?? "",
        farmArea: profile.farmArea ?? "",
        productionMode: profile.productionMode ?? "",
        onSiteProcessing: profile.onSiteProcessing ?? "",
        seasonality: profile.seasonality ?? "",
        takeover: profile.takeover ?? "",
        foundedYear: profile.foundedYear ? String(profile.foundedYear) : "",
        inventory: (profile.inventory as InventoryRow[] | null) ?? [],
        network: (((profile.network as Partial<NetworkRow>[] | null) ?? []).map((r) => ({
          nom: r.nom ?? "",
          role: r.role ?? "",
          groupe: r.groupe === "recommande" ? "recommande" : "partenaire",
          mot: r.mot ?? "",
        })) as NetworkRow[]),
        btob: (profile.btobSettings as BtobSettings | null) ?? {},
        minOrderValue: profile.minOrderValue != null ? String(profile.minOrderValue) : "",
        freeShipping: profile.freeShippingFrom != null ? String(profile.freeShippingFrom) : "",
        leadTime: ({ 1: "24", 2: "48", 3: "72", 5: "120", 7: "168" } as Record<number, string>)[
          profile.leadTimeDays ?? 2
        ] ?? "48",
        deliveryRadius: profile.deliveryRadius ?? "",
        deliveryDays: profile.deliveryDays ?? "",
        orderCutoffTime: profile.orderCutoffTime ?? "",
        coverUrl: profile.coverUrl ?? "",
        logoUrl: profile.logoUrl ?? "",
        mediaUrls: Array.isArray(profile.mediaUrls) ? (profile.mediaUrls as string[]) : [],
        produits: profile.products.map((p) => ({
          id: p.id,
          nom: p.name,
          detail: p.detail ?? "",
          formats: p.formats ?? "",
          prix: p.basePrice ? String(p.basePrice) : "",
          description: p.description ?? "",
          photoUrl: p.photoUrl ?? "",
        })),
        visibility:
          (profile.sectionVisibility as Record<string, { pro: boolean; pub: boolean }>) ?? {},
      }}
    />
  );
}
