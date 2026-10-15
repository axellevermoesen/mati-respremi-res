/**
 * Contenu éditable de la page d'accueil (admin → « Page d'accueil »).
 * Fichier « pur » (pas d'accès base) : partagé par l'éditeur admin (client) et
 * la page d'accueil (serveur). Les valeurs par défaut = les textes d'origine,
 * utilisées tant que rien n'est enregistré, et pour tout champ manquant.
 */

export type Link2 = { label: string; href: string };

export type HomeContent = {
  hero: {
    show: boolean;
    kicker: string;
    title: string; // un retour à la ligne = un retour à la ligne à l'écran
    text: string;
    image: string;
    primary: Link2;
    secondary: Link2;
  };
  steps: {
    show: boolean;
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  portrait: {
    show: boolean;
    kicker: string;
    title: string;
    producerId: string; // "" = automatique (un producteur actif avec photo de couverture)
    text: string; // vide = l'accroche / l'histoire du producteur
    image: string; // vide = la photo de couverture du producteur
  };
  network: {
    show: boolean;
    kicker: string;
    title: string;
    text: string;
  };
  catalogue: {
    show: boolean;
    kicker: string;
    title: string; // {produits} → « 128 produits », {producteurs} → « 24 producteurs » (vrais chiffres)
    productIds: string[]; // jusqu'à 4 ; vide = les 4 derniers produits avec photo
  };
  manifesto: {
    show: boolean;
    quote: string;
    signature: string;
  };
  content: {
    show: boolean;
    blogTitle: string;
    podcastTitle: string;
  };
};

export const DEFAULT_HOME: HomeContent = {
  hero: {
    show: true,
    kicker: "Producteurs × restaurants indépendants",
    title: "Une seule commande.\nUne seule livraison.\nDes dizaines de producteurs.",
    text: "Matières Premières mutualise les commandes et les tournées entre producteurs pour que votre cuisine reçoive du direct-producteur, sans la logistique de vingt fournisseurs.",
    image: "/img/barrel-cellar-wide.jpeg",
    primary: { label: "Voir le catalogue", href: "/catalogue" },
    secondary: { label: "Je suis producteur", href: "/connexion?role=producteur" },
  },
  steps: {
    show: true,
    title: "Comment ça marche",
    subtitle: "Trois étapes, une seule tournée de camion.",
    items: [
      {
        title: "Vous commandez à plusieurs producteurs",
        body: "Fromage du Jura, cidre normand, légumes de saison — un seul panier, un seul paiement.",
      },
      {
        title: "Les producteurs mutualisent la tournée",
        body: "Ceux d'une même région se coordonnent entre eux pour livrer ensemble, le même jour.",
      },
      {
        title: "Vous recevez, une fois, tout le monde",
        body: "Un seul créneau de livraison en cuisine. Zéro camion supplémentaire dans la cour.",
      },
    ],
  },
  portrait: {
    show: true,
    kicker: "Portrait de producteur",
    title: "La vitrine, pas juste la fiche produit",
    producerId: "",
    text: "",
    image: "",
  },
  network: {
    show: true,
    kicker: "Le réseau",
    title: "Les producteurs se recommandent entre eux",
    text: "Chaque profil producteur montre avec qui il mutualise déjà sa tournée — et qui il vous conseille pour compléter votre commande.",
  },
  catalogue: {
    show: true,
    kicker: "Le catalogue",
    title: "{produits}, {producteurs}",
    productIds: [],
  },
  manifesto: {
    show: true,
    quote:
      "Un fournisseur de moins à gérer n'est jamais un producteur de moins dans votre assiette.",
    signature: "On mutualise la logistique. Pas le goût.",
  },
  content: {
    show: true,
    blogTitle: "Le blog",
    podcastTitle: "Le podcast",
  },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Fusionne ce qui est en base avec les valeurs par défaut (champ par champ, types vérifiés). */
function merge<T>(def: T, val: unknown): T {
  if (Array.isArray(def)) {
    if (!Array.isArray(val)) return def;
    // Liste d'objets (étapes) : on garde le nombre d'éléments par défaut.
    if (def.length && isObj(def[0])) return def.map((d, i) => merge(d, val[i])) as T;
    return val.filter((x) => typeof x === "string") as T;
  }
  if (isObj(def)) {
    const src = isObj(val) ? val : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(def)) out[k] = merge((def as Record<string, unknown>)[k], src[k]);
    return out as T;
  }
  return (typeof val === typeof def ? val : def) as T;
}

export function resolveHome(data: unknown): HomeContent {
  return merge(DEFAULT_HOME, data);
}
