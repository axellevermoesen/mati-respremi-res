/**
 * Données de démonstration pour la carte du réseau (/reseau).
 * Producteurs fictifs des Hauts-de-France + liens entre eux.
 * Ré-exécutable : purge d'abord tous les comptes "@reseau.demo".
 *
 *   node --env-file=.env prisma/seed-reseau.mjs
 *
 * Pour tout retirer avant la mise en ligne :
 *   node --env-file=.env prisma/seed-reseau.mjs --clean
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const clean = process.argv.includes("--clean");

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// --- Producteurs de démo (repris de la maquette validée) ---
const PROD = [
  { key: "petitclos", nom: "Ferme du Petit Clos", cat: "Maraîchage", ville: "Béthune", lat: 50.53, lng: 2.64, bio: 1, ini: "PC", prod: "Légumes de plein champ, 40 variétés récoltées la veille.", depuis: 2009 },
  { key: "troisvall", nom: "Fromagerie des Trois Vallées", cat: "Fromage", ville: "Saint-Omer", lat: 50.75, lng: 2.252, bio: 0, ini: "TV", prod: "Tommes et pâtes pressées au lait cru, affinées sur planche d'épicéa.", depuis: 1998 },
  { key: "combe", nom: "Verger de la Combe", cat: "Arboriculture", ville: "Cambrai", lat: 50.176, lng: 3.235, bio: 1, ini: "VC", prod: "Pommes, poires et eaux-de-vie sur dix-huit hectares de vieux vergers.", depuis: 2003 },
  { key: "marais", nom: "Brasserie du Marais", cat: "Boissons", ville: "Douai", lat: 50.37, lng: 3.08, bio: 0, ini: "BM", prod: "Bières de fermentation haute, brassées par petits lots.", depuis: 2017 },
  { key: "dunes", nom: "Pêcherie des Dunes", cat: "Pêche", ville: "Boulogne-sur-Mer", lat: 50.726, lng: 1.614, bio: 0, ini: "PD", prod: "Petite pêche côtière à la ligne, marée du jour.", depuis: 1987 },
  { key: "hautchamp", nom: "Moulin du Haut Champ", cat: "Céréales", ville: "Amiens", lat: 49.894, lng: 2.296, bio: 1, ini: "HC", prod: "Farines écrasées sur meule de pierre, blés de population.", depuis: 2011 },
  { key: "rucher", nom: "Rucher des Trois Chênes", cat: "Miel & épices", ville: "Laon", lat: 49.564, lng: 3.624, bio: 1, ini: "RC", prod: "Cent quatre-vingts ruches en forêt, miels de terroir non chauffés.", depuis: 2015 },
  { key: "marquises", nom: "Safranière des Marquises", cat: "Miel & épices", ville: "Compiègne", lat: 49.418, lng: 2.826, bio: 0, ini: "SM", prod: "Safran récolté à la main, aromates séchés à basse température.", depuis: 2019 },
  { key: "pressales", nom: "GAEC des Prés Salés", cat: "Élevage", ville: "Montreuil-sur-Mer", lat: 50.464, lng: 1.763, bio: 1, ini: "PS", prod: "Agneau de pré-salé et bovins d'herbe, abattage local.", depuis: 1994 },
  { key: "endives", nom: "Terres d'Endives", cat: "Maraîchage", ville: "Valenciennes", lat: 50.358, lng: 3.523, bio: 0, ini: "TE", prod: "Endives de pleine terre, forcées en cave.", depuis: 2006 },
  { key: "avesnois", nom: "Cidrerie de l'Avesnois", cat: "Boissons", ville: "Avesnes-sur-Helpe", lat: 50.123, lng: 3.929, bio: 1, ini: "CA", prod: "Cidres fermiers et vinaigres, pommes de vergers pâturés.", depuis: 2001 },
  { key: "bocage", nom: "Chèvrerie du Bocage", cat: "Fromage", ville: "Saint-Quentin", lat: 49.848, lng: 3.287, bio: 1, ini: "CB", prod: "Cent dix chèvres, fromages affinés en cave voûtée.", depuis: 2013 },
  { key: "craie", nom: "Champignonnière de la Craie", cat: "Maraîchage", ville: "Beauvais", lat: 49.43, lng: 2.081, bio: 0, ini: "CC", prod: "Pleurotes et shiitakés poussés sur la paille du moulin voisin.", depuis: 2018 },
];

// [from, to, type, note] — type maquette : matiere / echange / tournee / savoir
const LINKS = [
  ["petitclos", "troisvall", "tournee", "Deux arrêts à douze kilomètres d'écart : un seul passage."],
  ["petitclos", "pressales", "matiere", "Fumier composté du GAEC sur les planches de maraîchage."],
  ["troisvall", "pressales", "matiere", "Le lait cru de l'après-midi part directement à l'affinage."],
  ["troisvall", "dunes", "tournee", "Le froid du camion sert au poisson comme au fromage."],
  ["combe", "avesnois", "matiere", "Pommes à cidre du verger, pressées à quarante kilomètres."],
  ["combe", "rucher", "echange", "Trente ruches en pollinisation au printemps, du miel à l'automne."],
  ["rucher", "bocage", "tournee", "Tournée Picardie du mercredi."],
  ["marais", "endives", "echange", "Les drêches nourrissent les couches d'endives."],
  ["marais", "avesnois", "savoir", "Une tireuse et une embouteilleuse partagées à mi-temps."],
  ["hautchamp", "craie", "matiere", "La paille du moulin devient substrat à pleurotes."],
  ["hautchamp", "marquises", "tournee", "Farines et safran dans la même palette."],
  ["dunes", "pressales", "tournee", "Un départ commun de la côte, deux fois par semaine."],
  ["endives", "bocage", "echange", "Petites endives et lactosérum : chacun valorise le rebut de l'autre."],
  ["marquises", "craie", "matiere", "Substrat épuisé du champignonniste en amendement de la safranière."],
  ["bocage", "marquises", "savoir", "Chambre d'affinage mutualisée à Saint-Quentin."],
  ["avesnois", "endives", "tournee", "Le camion de l'Escaut, jeudi matin."],
  // liens avec les vrais comptes de test
  ["_sagesse", "hautchamp", "matiere", "L'orge de printemps du moulin part au malt, puis dans la cuve."],
  ["_sagesse", "marais", "savoir", "Deux brasseurs qui se prêtent leurs levures."],
  ["_sagesse", "troisvall", "tournee", "Même camion le mardi vers la plateforme de Lille."],
  ["_dubois", "petitclos", "tournee", "Tournée du samedi, secteur Béthune."],
];

const typeToConn = (t) => (t === "tournee" ? "DELIVERY_PARTNER" : "RECOMMENDATION");

async function purge() {
  const del = await db.user.deleteMany({ where: { email: { endsWith: "@reseau.demo" } } });
  console.log(`  ${del.count} compte(s) de démo supprimé(s).`);
}

// coords des vrais comptes de test (par ville)
const REAL_COORDS = {
  "la-brasserie-sagesse": { lat: 50.291, lng: 2.777 },
  "fromagerie-dubois": { lat: 50.53, lng: 2.641 },
  "la-ferme-d-axelle": { lat: 49.183, lng: -0.37 },
};

async function main() {
  console.log(clean ? "Nettoyage des données de démo…" : "Semis des données de démo…");
  await purge();

  if (clean) {
    console.log("Terminé (nettoyage seul).");
    return;
  }

  // 1) coords sur les vrais producteurs
  for (const [slug, c] of Object.entries(REAL_COORDS)) {
    await db.producerProfile
      .update({ where: { slug }, data: { latitude: c.lat, longitude: c.lng } })
      .then(() => console.log(`  coords → ${slug}`))
      .catch(() => console.log(`  (ignoré : ${slug} absent)`));
  }

  // 2) producteurs de démo
  const idByKey = {};
  for (const p of PROD) {
    const email = `${p.key}@reseau.demo`;
    const slug = `${slugify(p.nom)}-demo`;
    const user = await db.user.create({
      data: {
        email,
        role: "PRODUCER",
        name: p.nom,
        producerProfile: {
          create: {
            slug,
            farmName: p.nom,
            description: `${p.prod} Exploitation installée à ${p.ville} depuis ${p.depuis}.`,
            practices: p.bio ? "Agriculture biologique" : "Agriculture raisonnée",
            region: "Hauts-de-France",
            city: p.ville,
            productionType: p.cat,
            tagline: p.prod,
            foundedYear: p.depuis,
            latitude: p.lat,
            longitude: p.lng,
            productionMode: p.bio ? "bio" : "raisonnee",
          },
        },
      },
      select: { producerProfile: { select: { id: true } } },
    });
    idByKey[p.key] = user.producerProfile.id;
    console.log(`  producteur → ${p.nom}`);
  }

  // vrais comptes pour les liens
  const real = await db.producerProfile.findMany({
    where: { slug: { in: ["la-brasserie-sagesse", "fromagerie-dubois"] } },
    select: { id: true, slug: true },
  });
  idByKey["_sagesse"] = real.find((r) => r.slug === "la-brasserie-sagesse")?.id;
  idByKey["_dubois"] = real.find((r) => r.slug === "fromagerie-dubois")?.id;

  // 3) liens
  let n = 0;
  for (const [from, to, type, note] of LINKS) {
    const fromId = idByKey[from];
    const toId = idByKey[to];
    if (!fromId || !toId) continue;
    await db.producerConnection
      .create({ data: { fromId, toId, type: typeToConn(type), note } })
      .then(() => n++)
      .catch(() => {});
  }
  console.log(`  ${n} lien(s) créé(s).`);
  console.log("Terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
