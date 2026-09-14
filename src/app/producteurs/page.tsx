import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProducersDirectory, type DirRow } from "./ProducersDirectory";

export const metadata: Metadata = {
  title: "Nos producteurs",
  description:
    "Les fermes, ateliers et bateaux du réseau Matières Premières. Tous joignables directement.",
};

const BIO_HINTS = ["bio", "ecocert", "agriculture biologique", "nature & progrès", "demeter"];

function isBio(p: {
  certifications: string | null;
  productionMode: string | null;
  certifsList: unknown;
}) {
  const mode = (p.productionMode ?? "").toLowerCase();
  if (mode === "bio" || mode === "conversion" || mode === "biodynamie") return true;
  const list = Array.isArray(p.certifsList)
    ? (p.certifsList as Array<{ nom?: string }>).map((c) => c?.nom ?? "").join(" ")
    : "";
  const hay = `${p.certifications ?? ""} ${list}`.toLowerCase();
  return BIO_HINTS.some((h) => hay.includes(h));
}

function firstSentence(s: string) {
  const trimmed = s.trim();
  const m = trimmed.match(/^.{0,150}?[.!?](\s|$)/);
  return (m ? m[0] : trimmed.slice(0, 150)).trim();
}

export default async function ProducteursPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const recentCutoff = new Date(startOfToday);
  recentCutoff.setDate(recentCutoff.getDate() - 120);

  const producers = await withRetry(() =>
    prisma.producerProfile.findMany({
      where: { user: { status: "ACTIVE" } },
      orderBy: { farmName: "asc" },
      select: {
        slug: true,
        farmName: true,
        productionType: true,
        city: true,
        region: true,
        tagline: true,
        description: true,
        values: true,
        certifications: true,
        productionMode: true,
        certifsList: true,
        foundedYear: true,
        coverUrl: true,
        createdAt: true,
        btobSettings: true,
        products: { where: { isActive: true }, select: { basePrice: true } },
        tourStops: {
          where: {
            tour: {
              date: { gte: startOfToday },
              status: { notIn: ["DONE", "CANCELLED"] },
            },
          },
          orderBy: { tour: { date: "asc" } },
          take: 1,
          select: { tour: { select: { region: true, date: true } } },
        },
      },
    }),
  );

  const rows: DirRow[] = producers
    .filter((p) => p.farmName && p.slug)
    .map((p) => {
      const prices = p.products
        .map((x) => Number(x.basePrice))
        .filter((n) => Number.isFinite(n) && n > 0);
      const nextTour = p.tourStops[0]?.tour ?? null;
      const btob = (p.btobSettings as { newRequests?: boolean } | null) ?? {};
      return {
        slug: p.slug,
        nom: p.farmName,
        cat: p.productionType?.trim() || "Producteur",
        ville: p.city?.trim() || p.region,
        region: p.region,
        prod: p.tagline?.trim() || firstSentence(p.description),
        tags: (p.values ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3),
        bio: isBio(p),
        nouveau: p.createdAt >= recentCutoff,
        dispo: btob.newRequests !== false,
        depuis: p.foundedYear ?? null,
        coverUrl: p.coverUrl ?? "",
        produits: prices.length,
        mini: prices.length
          ? `${Math.min(...prices).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`
          : null,
        livraison: nextTour
          ? `Tournée ${nextTour.region} · ${new Date(nextTour.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}`
          : "Livraison directe",
      };
    });

  return (
    <>
      <SiteHeader />
      <ProducersDirectory producers={rows} />
      <SiteFooter />
    </>
  );
}
