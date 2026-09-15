import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Adresse email invalide.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis."),
});

export const signupSchema = z.object({
  role: z.enum(["PRODUCER", "RESTAURANT", "RESELLER"]),
  companyName: z.string().trim().min(2, "Ce nom est trop court."),
  email,
  password: z.string().min(8, "8 caractères minimum."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

const opt = z.string().trim().optional().or(z.literal("").transform(() => undefined));

/** Profil acheteur (formulaire d'inscription en 2 étapes). */
export const buyerProfileSchema = z.object({
  dirigeantPrenom: z.string().trim().min(1, "Prénom requis."),
  dirigeantNom: z.string().trim().min(1, "Nom requis."),
  dirigeantTelephone: opt,
  structureNom: z.string().trim().min(2, "Nom de la structure requis."),
  typeEtablissement: z.enum(["restaurant", "epicerie", "autre"]).catch("restaurant"),
  siret: opt,
  adresse: opt,
  codePostal: opt,
  ville: opt,
  contact2Prenom: opt,
  contact2Nom: opt,
  contact2Fonction: opt,
  contact2Telephone: opt,
  contact2Email: opt,
});

export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;

/** Profil producteur (parcours d'inscription en 18 étapes). */
export const producerProfileSchema = z.object({
  dirigeantPrenom: opt,
  dirigeantNom: opt,
  structureNom: opt,
  siret: opt,
  adresse: opt,
  codePostal: opt,
  ville: opt,
  tagline: opt,
  typeProduction: opt,
  region: opt,
  histoireDebut: opt,
  histoireAujourdhui: opt,
  commandeMinimum: opt,
  anneeCreation: opt,
  valeurs: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  produits: z
    .array(
      z.object({
        nom: z.string().trim().min(1),
        cat: z.string().trim().optional().default(""),
        prix: z.string().trim().optional().default(""),
        unite: z.string().trim().optional().default(""),
        desc: z.string().trim().optional().default(""),
        statut: z.enum(["ligne", "grenier"]).catch("ligne"),
      }),
    )
    .default([]),
});

export type ProducerProfileInput = z.infer<typeof producerProfileSchema>;

/** Éditeur « Ma page » (profil producteur, construit par rubriques). */
const audience = z.object({ pro: z.boolean(), pub: z.boolean() });

export const maPageSchema = z.object({
  // Rubrique Identité
  farmName: z.string().trim().min(1, "Le nom est requis."),
  productionType: z.string().trim().optional().default(""),
  tagline: z.string().trim().optional().default(""),
  region: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  // Rubrique Mon histoire
  histoire: z.string().trim().optional().default(""),
  // Rubrique Valeurs
  valeurs: z.array(z.string().trim().min(1)).default([]),
  // Rubrique Contact
  contacts: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().optional().default(""),
        pro: z.boolean().default(true),
        pub: z.boolean().default(true),
      }),
    )
    .default([]),
  mapAddress: z.string().trim().optional().default(""),
  responseDelay: z.string().trim().optional().default(""),
  // Rubrique "Acheter mes produits en direct"
  directMarkets: z
    .array(
      z.object({
        nom: z.string().trim().optional().default(""),
        jour: z.string().trim().optional().default(""),
        lieu: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  farmShopHours: z.string().trim().optional().default(""),
  farmShopVisit: z.string().trim().optional().default(""),
  farmShopAddress: z.string().trim().optional().default(""),
  // Rubrique "Où trouver mes produits"
  resellers: z
    .array(
      z.object({
        nom: z.string().trim().optional().default(""),
        type: z.string().trim().optional().default(""),
        ville: z.string().trim().optional().default(""),
        origine: z.enum(["plateforme", "hors"]).catch("hors"),
      }),
    )
    .default([]),
  amaps: z
    .array(
      z.object({
        nom: z.string().trim().optional().default(""),
        detail: z.string().trim().optional().default(""),
        origine: z.enum(["plateforme", "hors"]).catch("hors"),
      }),
    )
    .default([]),
  otherResellersMention: z.boolean().default(false),
  // Rubrique "Ils utilisent mes produits"
  clients: z
    .array(
      z.object({
        nom: z.string().trim().optional().default(""),
        role: z.string().trim().optional().default(""),
        produit: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  // Rubrique "Certifications & labels"
  certifs: z
    .array(
      z.object({
        nom: z.string().trim().min(1),
        annee: z.string().trim().optional().default(""),
        perso: z.boolean().default(false),
        lien: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  // Rubrique "Informations sur l'exploitation"
  legalForm: z.string().trim().optional().default(""),
  siret: z.string().trim().optional().default(""),
  headcount: z.string().trim().optional().default(""),
  capacity: z.string().trim().optional().default(""),
  capacityUnit: z.string().trim().optional().default(""),
  farmArea: z.string().trim().optional().default(""),
  productionMode: z.string().trim().optional().default(""),
  onSiteProcessing: z.string().trim().optional().default(""),
  seasonality: z.string().trim().optional().default(""),
  takeover: z.string().trim().optional().default(""),
  foundedYear: z.string().trim().optional().default(""),
  inventory: z
    .array(
      z.object({
        poste: z.string().trim().optional().default(""),
        quantite: z.string().trim().optional().default(""),
        precision: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  // Rubrique "Mon réseau"
  network: z
    .array(
      z.object({
        nom: z.string().trim().optional().default(""),
        role: z.string().trim().optional().default(""),
        groupe: z.enum(["partenaire", "recommande"]).catch("partenaire"),
        mot: z
          .string()
          .trim()
          .optional()
          .default("")
          .transform((s) => s.slice(0, 400)),
      }),
    )
    .default([]),
  // Rubrique "Mon activité BtoB"
  btobVisible: z.boolean().default(true),
  btobNewRequests: z.boolean().default(true),
  btobManualConfirm: z.boolean().default(true),
  // Rubrique "Commande & logistique pro"
  minOrderValue: z.string().trim().optional().default(""),
  freeShipping: z.string().trim().optional().default(""),
  leadTime: z.string().trim().optional().default(""),
  deliveryRadius: z.string().trim().optional().default(""),
  deliveryDays: z.string().trim().optional().default(""),
  orderCutoffTime: z.string().trim().optional().default(""),
  // Rubrique Aperçu des produits
  produits: z
    .array(
      z.object({
        id: z.string().optional().default(""),
        nom: z.string().trim().min(1),
        detail: z.string().trim().optional().default(""),
        formats: z.string().trim().optional().default(""),
        prix: z.string().trim().optional().default(""),
        description: z.string().trim().optional().default(""),
      }),
    )
    .default([]),
  // Visibilité par rubrique
  visibility: z.record(z.string(), audience).default({}),
});

export type MaPageInput = z.infer<typeof maPageSchema>;

/** Formulaire /contact. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom et prénom."),
  structure: opt,
  email,
  phone: opt,
  profile: z.enum(["producteur", "restaurateur", "autre"], {
    error: "Précisez qui vous êtes.",
  }),
  subject: z.enum(["commande", "livraison", "rejoindre", "facturation", "autre"], {
    error: "Choisissez un sujet.",
  }),
  message: z.string().trim().min(10, "Un peu plus de détails, s'il vous plaît (10 caractères min)."),
  consent: z
    .string()
    .nullish()
    .transform((v) => v === "on"),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Un bloc de contenu (voir Block dans src/lib/content.ts). */
const blockSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("p"), text: z.string().trim().min(1) }),
  z.object({ t: z.literal("h2"), text: z.string().trim().min(1), id: z.string().trim().min(1) }),
  z.object({ t: z.literal("quote"), text: z.string().trim().min(1), cite: z.string().trim().optional() }),
  z.object({ t: z.literal("list"), items: z.array(z.string().trim().min(1)).min(1) }),
  z.object({
    t: z.literal("callout"),
    kicker: z.string().trim().min(1),
    items: z.array(z.string().trim().min(1)).min(1),
  }),
  z.object({
    t: z.literal("img"),
    src: z.string().trim().min(1),
    alt: z.string().trim().default(""),
    caption: z.string().trim().optional(),
  }),
]);

const contentStatus = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]);

const scheduledAtField = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

/** Un champ "body" envoyé en JSON (par un input caché) et validé comme une liste de blocs. */
const bodyField = z.string().transform((raw, ctx) => {
  try {
    const parsed = JSON.parse(raw);
    const result = z.array(blockSchema).safeParse(parsed);
    if (!result.success) {
      const issue = result.error.issues[0];
      const blockIndex = typeof issue?.path[0] === "number" ? issue.path[0] + 1 : undefined;
      ctx.addIssue({
        code: "custom",
        message: blockIndex
          ? `Bloc de contenu n°${blockIndex} incomplet (${issue.message.toLowerCase()}).`
          : "Contenu invalide.",
      });
      return z.NEVER;
    }
    return result.data;
  } catch {
    ctx.addIssue({ code: "custom", message: "Contenu illisible (JSON invalide)." });
    return z.NEVER;
  }
});

const slugField = (label: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, `${label} invalide (lettres, chiffres, tirets, / autorisé).`);

/** Formulaire /admin/pages (création + édition d'une page institutionnelle). */
export const pageSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court."),
  slug: slugField("Slug"),
  excerpt: z.string().trim().optional().default(""),
  metaTitle: z.string().trim().optional().default(""),
  metaDescription: z.string().trim().optional().default(""),
  status: contentStatus,
  scheduledAt: scheduledAtField,
  body: bodyField,
});

export type PageInput = z.infer<typeof pageSchema>;

/** Formulaire /admin/articles. */
export const articleSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court."),
  slug: slugField("Slug"),
  excerpt: z.string().trim().optional().default(""),
  topic: z.string().trim().min(1, "Rubrique requise."),
  img: z.string().trim().optional().default(""),
  author: z.string().trim().optional().default(""),
  authorInitials: z.string().trim().optional().default(""),
  featured: z.string().nullish().transform((v) => v === "on"),
  metaTitle: z.string().trim().optional().default(""),
  metaDescription: z.string().trim().optional().default(""),
  status: contentStatus,
  scheduledAt: scheduledAtField,
  body: bodyField,
});

export type ArticleInput = z.infer<typeof articleSchema>;

/** Formulaire /admin/podcasts (pas de corps ni de SEO : pas de page dédiée par épisode). */
export const episodeSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court."),
  slug: slugField("Slug"),
  num: z.string().trim().min(1, "Numéro d'épisode requis."),
  excerpt: z.string().trim().optional().default(""),
  topic: z.string().trim().min(1, "Rubrique requise."),
  guest: z.string().trim().min(1, "Invité requis."),
  role: z.string().trim().optional().default(""),
  initials: z.string().trim().optional().default(""),
  img: z.string().trim().optional().default(""),
  seconds: z.coerce.number().int().min(1, "Durée invalide."),
  status: contentStatus,
  scheduledAt: scheduledAtField,
});

export type EpisodeInput = z.infer<typeof episodeSchema>;

/** Formulaire /admin/comptes/nouveau (création manuelle d'un compte par l'admin). */
export const createAccountSchema = z.object({
  role: z.enum(["PRODUCER", "RESTAURANT", "RESELLER"], { error: "Choisissez un type de compte." }),
  companyName: z.string().trim().min(2, "Nom trop court."),
  email,
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
