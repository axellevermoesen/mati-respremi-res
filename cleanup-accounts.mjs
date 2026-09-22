import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const toDelete = [
  "petitclos@reseau.demo", "troisvall@reseau.demo", "combe@reseau.demo", "marais@reseau.demo",
  "dunes@reseau.demo", "hautchamp@reseau.demo", "rucher@reseau.demo", "marquises@reseau.demo",
  "pressales@reseau.demo", "endives@reseau.demo", "avesnois@reseau.demo", "bocage@reseau.demo",
  "craie@reseau.demo", "dubois@fromagerie.fr", "test-mapage@sagesse.fr", "chef@comptoir-halles.fr",
];

for (const email of toDelete) {
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) { console.log("déjà absent:", email); continue; }
  await prisma.user.delete({ where: { email } });
  console.log("supprimé:", email);
}

// Retire le vieux profil producteur laissé sous le compte admin
const admin = await prisma.user.findUnique({
  where: { email: "axelle.vermoesen@gmail.com" },
  include: { producerProfile: true },
});
if (admin?.producerProfile) {
  await prisma.producerProfile.delete({ where: { id: admin.producerProfile.id } });
  console.log("profil producteur retiré du compte admin (La ferme d'Axelle)");
} else {
  console.log("compte admin : pas de profil producteur à retirer");
}

console.log("---");
const remaining = await prisma.user.findMany({ select: { email: true, role: true, status: true } });
console.log("Comptes restants :", JSON.stringify(remaining, null, 2));

await prisma.$disconnect();
