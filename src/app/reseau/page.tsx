import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NetworkMap, type NLink, type NProd, type NTour } from "./NetworkMap";

export const metadata: Metadata = {
  title: "Carte du réseau",
  description:
    "Qui travaille avec qui : les liens, les échanges et les tournées mutualisées entre producteurs.",
};

function isBio(p: {
  productionMode: string | null;
  certifications: string | null;
  certifsList: unknown;
}) {
  const mode = (p.productionMode ?? "").toLowerCase();
  if (mode === "bio" || mode === "conversion" || mode === "biodynamie") return true;
  const list = Array.isArray(p.certifsList)
    ? (p.certifsList as Array<{ nom?: string }>).map((c) => c?.nom ?? "").join(" ")
    : "";
  return /bio|ecocert|agriculture biologique|demeter/i.test(`${p.certifications ?? ""} ${list}`);
}

export default async function ReseauPage() {
  const [producers, connections, tours] = await withRetry(() =>
    Promise.all([
      prisma.producerProfile.findMany({
        where: { latitude: { not: null }, longitude: { not: null } },
        orderBy: { farmName: "asc" },
        select: {
          id: true,
          slug: true,
          farmName: true,
          productionType: true,
          city: true,
          region: true,
          latitude: true,
          longitude: true,
          foundedYear: true,
          tagline: true,
          description: true,
          productionMode: true,
          certifications: true,
          certifsList: true,
        },
      }),
      prisma.producerConnection.findMany({
        select: { fromId: true, toId: true, type: true, note: true },
      }),
      prisma.deliveryTour.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          region: true,
          status: true,
          stops: { select: { producerId: true } },
        },
      }),
    ]),
  );

  const prods: NProd[] = producers.map((p) => ({
    id: p.id,
    slug: p.slug,
    nom: p.farmName,
    cat: p.productionType?.trim() || "Producteur",
    ville: p.city?.trim() || p.region,
    lat: p.latitude as number,
    lng: p.longitude as number,
    bio: isBio(p),
    depuis: p.foundedYear ?? null,
    prod: p.tagline?.trim() || p.description.slice(0, 160),
  }));

  const ids = new Set(prods.map((p) => p.id));
  const links: NLink[] = connections
    .filter((c) => ids.has(c.fromId) && ids.has(c.toId) && c.fromId !== c.toId)
    .map((c) => ({ from: c.fromId, to: c.toId, type: c.type, note: c.note ?? "" }));

  const ntours: NTour[] = tours
    .map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      region: t.region,
      stops: t.stops.map((s) => s.producerId).filter((id) => ids.has(id)),
    }))
    .filter((t) => t.stops.length >= 2);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader fluid />
      <NetworkMap producers={prods} links={links} tours={ntours} />
      <SiteFooter />
    </div>
  );
}
