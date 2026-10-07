import type { PostKind, Role } from "@prisma/client";

/**
 * Actus des producteurs : libellés, couleurs et petits calculs partagés entre
 * l'espace producteur (publication), l'espace particulier (fil), le compte pro
 * et la page publique du producteur.
 */

export const POST_KIND_LABEL: Record<PostKind, string> = {
  TEXT: "Actu",
  PHOTO: "Photo",
  PRODUCT: "Arrivage",
  EVENT: "Événement",
  RESTAURANT: "Au restaurant",
};

export const POST_KIND_COLOR: Record<PostKind, string> = {
  TEXT: "var(--text-muted)",
  PHOTO: "var(--text-muted)",
  PRODUCT: "var(--green-700)",
  EVENT: "var(--rose-600)",
  RESTAURANT: "var(--green-700)",
};

export const POST_KIND_HINT: Record<PostKind, string> = {
  TEXT: "Une nouvelle, un mot sur la saison.",
  PHOTO: "Une image de la ferme, du chai, des champs.",
  PRODUCT: "Un produit qui arrive ou revient.",
  EVENT: "Portes ouvertes, marché, dégustation.",
  RESTAURANT: "Un plat avec vos produits, chez un client.",
};

export type Audience = "pro" | "pub";

/** Pros = restaurateurs et revendeurs ; tout le reste voit la version grand public. */
export function audienceForRole(role?: Role | null): Audience {
  return role === "RESTAURANT" || role === "RESELLER" ? "pro" : "pub";
}

/** Filtre Prisma : les actus destinées à ce public. */
export function audienceWhere(audience: Audience) {
  return audience === "pro" ? { forPros: true } : { forPublic: true };
}

/** Texte à afficher selon le public (les pros peuvent avoir leur propre version). */
export function bodyFor(post: { body: string; bodyPro: string | null }, audience: Audience) {
  return audience === "pro" && post.bodyPro ? post.bodyPro : post.body;
}

/** Initiales d'un nom de ferme : « Fromagerie Dubois » → « D », « Domaine Lescure » → « L ». */
export function farmInitials(name: string) {
  const cleaned = name.replace(
    /^(Fromagerie|Cidrerie|Domaine|Ferme|Moulin|Rucher|Bergerie|Brasserie|Maison|Les?|La)\s+(du|des|de la|de|d')?\s*/i,
    "",
  );
  const letters = cleaned
    .split(/[\s'’-]+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return letters || name.slice(0, 2).toUpperCase();
}

/** Lundi 00:00 de la semaine de `d` (heure locale du serveur). */
export function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function frShortDate(d: Date) {
  // « mer. 7 oct. »
  const s = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function weekLabel(monday: Date) {
  return `Semaine du ${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

export function relativeDays(d: Date, now: Date) {
  const days = Math.floor((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  if (days < 30) return `il y a ${days} jours`;
  return `le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Le prochain dimanche (ou aujourd'hui si on est dimanche), pour « votre récap de dimanche ». */
export function nextSunday(now: Date) {
  const x = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  x.setDate(x.getDate() + ((7 - x.getDay()) % 7));
  return x;
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

/** Ce qu'il faut sélectionner pour afficher une carte d'actu. */
export const POST_CARD_SELECT = {
  id: true,
  kind: true,
  title: true,
  body: true,
  bodyPro: true,
  imageUrl: true,
  forPros: true,
  forPublic: true,
  eventDate: true,
  eventTime: true,
  eventPlace: true,
  productName: true,
  productNote: true,
  restaurantName: true,
  restaurantPlace: true,
  createdAt: true,
  producer: { select: { id: true, slug: true, farmName: true, city: true, region: true, logoUrl: true } },
} as const;
