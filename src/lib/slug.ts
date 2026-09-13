/** Transforme un texte libre en identifiant d'URL (« La Brasserie Sagesse » → « la-brasserie-sagesse »). */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
  return base || "producteur";
}
