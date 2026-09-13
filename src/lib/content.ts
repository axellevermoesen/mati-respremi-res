/**
 * Contenu éditorial du média « Matières Premières » (blog + podcast).
 * Statique pour l'instant — à brancher sur un CMS plus tard. Aucune dépendance base.
 */

export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string; id: string }
  | { t: "quote"; text: string; cite?: string }
  | { t: "list"; items: string[] }
  | { t: "callout"; kicker: string; items: string[] }
  | { t: "img"; src: string; alt: string; caption?: string };

export type Article = {
  slug: string;
  topic: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readMin: number;
  img: string;
  author: string;
  authorInitials: string;
  featured?: boolean;
  body: Block[];
};

export type Episode = {
  slug: string;
  num: string;
  topic: string;
  title: string;
  excerpt: string;
  guest: string;
  initials: string;
  role: string;
  date: string; // ISO
  durationLabel: string;
  clock: string;
  seconds: number;
  img: string;
};

const IMG = {
  barrel: "/img/barrel-cellar-wide.jpeg",
  cheese: "/img/cheese-wheels-aging.jpeg",
  hand: "/img/producer-hand-barrel.jpeg",
  farm1: "/img/farm-1.jpeg",
  farm2: "/img/farm-2.jpeg",
  farm3: "/img/farm-3.jpeg",
};

export const ARTICLES: Article[] = [
  {
    slug: "ce-que-ton-steak-a-vu",
    topic: "Impact",
    title: "Ce que ton steak a vu avant d'arriver dans ton assiette",
    excerpt:
      "Le trajet complet d'une pièce de bœuf, de l'éleveur à la carte du restaurant. Il y a plus de monde sur la route que tu ne l'imagines, et chacun prend sa part.",
    date: "2026-08-24",
    readMin: 8,
    img: IMG.hand,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    featured: true,
    body: [
      {
        t: "p",
        text: "Un steak arrive dans une assiette après un parcours que personne ne raconte sur la carte. Ce n'est pas un scandale, c'est une chaîne : un éleveur, un abattoir, un atelier de découpe, un grossiste, parfois deux, puis une cuisine. Chaque maillon fait un vrai métier. Le problème n'est pas leur existence, c'est qu'à la fin, plus personne ne sait qui a fait quoi.",
      },
      { t: "h2", id: "cinq-maillons", text: "Cinq maillons, une seule étiquette" },
      {
        t: "p",
        text: "La bête naît et grandit chez l'éleveur, souvent deux à trois ans pour une race à viande. Elle part ensuite à l'abattoir, rarement le plus proche : les fermetures successives ont allongé les trajets, et c'est le premier endroit où l'origine devient floue. L'atelier de découpe transforme la carcasse en pièces, le grossiste consolide, le restaurant commande. À l'arrivée, l'étiquette mentionne un pays. Pas une ferme.",
      },
      {
        t: "p",
        text: "C'est précisément là que la traçabilité se perd — non pas par malveillance, mais parce que rien dans la chaîne n'est conçu pour faire remonter un nom propre jusqu'au menu.",
      },
      {
        t: "quote",
        text: "On ne vend pas de la viande. On vend trois ans de travail, découpés en portions de 180 grammes.",
        cite: "Un éleveur des Hauts-de-France, rencontré pour cet article",
      },
      { t: "h2", id: "ce-que-le-prix-ne-dit-pas", text: "Ce que le prix ne dit pas" },
      {
        t: "p",
        text: "Sur une pièce vendue en restaurant, la part qui revient à l'éleveur est la plus petite ligne de la facture — et la seule qui porte le risque climatique, sanitaire et fourrager. Les autres maillons se rémunèrent sur un volume qu'ils ne produisent pas. Ce n'est pas un vol : c'est un modèle où la valeur se crée en amont et se capte en aval.",
      },
      {
        t: "list",
        items: [
          "Le prix payé à l'éleveur se négocie souvent à la carcasse entière, pas à la pièce noble.",
          "Le transport et le froid pèsent d'autant plus lourd que les volumes sont petits et dispersés.",
          "Chaque intermédiaire ajoute une marge, mais aussi un point où l'information d'origine s'efface.",
        ],
      },
      {
        t: "img",
        src: IMG.cheese,
        alt: "Produits en cours d'affinage sur des étagères en bois",
        caption: "Le temps long, ici sur du fromage : le même raisonnement s'applique à la viande.",
      },
      {
        t: "h2",
        id: "ce-que-tu-peux-demander",
        text: "Ce que tu peux demander, concrètement",
      },
      {
        t: "p",
        text: "La bonne question n'est pas « c'est bio ? » mais « ça vient de chez qui ? ». Un fournisseur qui connaît le nom de la ferme, la race et l'abattoir répond en dix secondes. Un fournisseur qui ne le sait pas te le dira aussi, à sa manière : il parlera d'origine France et changera de sujet.",
      },
      {
        t: "p",
        text: "Demander l'amont ne coûte rien. Et une fois que la question devient normale, la chaîne finit par s'organiser pour y répondre — c'est comme ça que les circuits courts ont commencé, pas autrement.",
      },
      {
        t: "callout",
        kicker: "En bref",
        items: [
          "Entre la ferme et l'assiette, cinq métiers se succèdent — et l'origine se dilue à chaque passage.",
          "La part de l'éleveur est la plus petite ligne du prix, et la seule exposée au risque.",
          "La question utile tient en quatre mots : ça vient de chez qui ?",
        ],
      },
    ],
  },
  {
    slug: "qui-prend-quoi-sur-un-yaourt-a-1-euro",
    topic: "Filière",
    title: "Qui prend quoi sur un yaourt à 1 €",
    excerpt:
      "On a démonté le prix ligne par ligne. Le producteur n'est pas celui qui rit le plus.",
    date: "2026-08-21",
    readMin: 6,
    img: IMG.cheese,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    body: [
      {
        t: "p",
        text: "Un yaourt nature vendu un euro en grande surface, c'est un objet simple : du lait, des ferments, un pot. Le prix, lui, l'est beaucoup moins. On a repris la facture depuis le début, avec un éleveur laitier, une petite laiterie et un distributeur qui ont accepté de parler chiffres.",
      },
      { t: "h2", id: "le-lait", text: "Le lait, payé en centimes" },
      {
        t: "p",
        text: "Le prix du litre payé au producteur tourne autour de quarante centimes selon les années et les contrats. Dans un pot de 125 grammes, la matière première laitière pèse quelques centimes. C'est la ligne la plus scrutée de la filière, et paradoxalement la plus basse.",
      },
      {
        t: "p",
        text: "L'éleveur porte pourtant l'essentiel du risque : le prix de l'aliment, la météo sur les fourrages, la santé du troupeau. Quand une charge grimpe, elle grimpe chez lui d'abord.",
      },
      { t: "h2", id: "la-transformation", text: "La transformation et l'emballage" },
      {
        t: "p",
        text: "Fermentation, conditionnement, contrôle qualité, pot et opercule : c'est là que se joue une grosse part du coût. Une laiterie de taille modeste n'a pas les volumes pour amortir ses lignes comme un industriel — d'où des yaourts fermiers structurellement plus chers, pas plus « marge ».",
      },
      {
        t: "list",
        items: [
          "Matière première laitière : quelques centimes.",
          "Transformation, emballage, logistique froide : la moitié du prix, environ.",
          "Distribution et marge du magasin : le reste, avec des écarts énormes selon l'enseigne.",
        ],
      },
      {
        t: "quote",
        text: "On ne se bat pas sur le prix du yaourt. On se bat pour que le prix du lait tienne toute l'année.",
        cite: "Une éleveuse laitière du Nord",
      },
      {
        t: "p",
        text: "La conclusion n'est pas « la grande distribution vole tout le monde ». C'est que sur un produit à un euro, il ne reste presque rien à répartir, et que le premier maillon est aussi celui qui a le moins de marge de manœuvre pour encaisser un coup dur.",
      },
    ],
  },
  {
    slug: "le-sol-nest-pas-un-support",
    topic: "Agriculture",
    title: "Le sol n'est pas un support, c'est un organisme",
    excerpt:
      "Vie microbienne, couverts végétaux, rotations : pourquoi ça finit par se goûter.",
    date: "2026-08-17",
    readMin: 9,
    img: IMG.farm1,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    body: [
      {
        t: "p",
        text: "On parle du sol comme d'un contenant : on y met des graines, on y ajoute des intrants, on récolte. Les agronomes qui travaillent sur la vie des sols le décrivent autrement — comme un système vivant, dense, avec sa propre logique, qu'on peut nourrir ou épuiser.",
      },
      { t: "h2", id: "sous-la-surface", text: "Ce qui se passe sous la surface" },
      {
        t: "p",
        text: "Dans une poignée de terre en bonne santé, il y a plus de micro-organismes que d'humains sur la planète. Champignons, bactéries, vers : ils décomposent la matière, rendent les minéraux disponibles pour la plante, structurent la terre pour qu'elle retienne l'eau sans s'asphyxier.",
      },
      {
        t: "p",
        text: "Un sol travaillé en permanence, laissé nu entre deux cultures et nourri uniquement à l'engrais soluble, perd progressivement cette activité. Il devient un support, justement — et il faut alors compenser chaque fonction perdue avec un produit.",
      },
      { t: "h2", id: "ce-qui-change", text: "Les pratiques qui changent la donne" },
      {
        t: "list",
        items: [
          "Couvrir le sol en interculture, pour nourrir la vie microbienne et limiter l'érosion.",
          "Réduire le travail du sol, pour ne pas casser les réseaux fongiques à chaque passage.",
          "Allonger les rotations, pour couper les cycles de maladies sans chimie.",
        ],
      },
      {
        t: "quote",
        text: "Le jour où j'ai arrêté de labourer, j'ai eu l'impression de désobéir. Trois ans après, la terre s'émiette toute seule dans la main.",
        cite: "Un céréalier de la Somme",
      },
      {
        t: "p",
        text: "Est-ce que ça se goûte ? Sur certaines cultures, oui — une carotte poussée dans un sol vivant a une intensité que les cuisiniers repèrent. Sur d'autres, la différence se voit surtout dans la régularité des rendements et la résistance aux années sèches. C'est moins spectaculaire, mais c'est ce qui fait tenir une ferme.",
      },
    ],
  },
  {
    slug: "manger-de-saison-sans-devenir-insupportable",
    topic: "Alimentation",
    title: "Manger de saison sans devenir insupportable en soirée",
    excerpt:
      "Ce qui compte vraiment, ce qui relève du folklore, et comment faire la différence.",
    date: "2026-08-12",
    readMin: 5,
    img: IMG.farm2,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    body: [
      {
        t: "p",
        text: "« Manger de saison » est devenu un marqueur social autant qu'une pratique. On peut le faire sans en faire un sujet à table. Voici ce qui a un vrai effet, et ce qui n'en a pas.",
      },
      { t: "h2", id: "ce-qui-compte", text: "Ce qui compte" },
      {
        t: "p",
        text: "L'impact principal de la saisonnalité, c'est d'éviter le forçage : une tomate de pleine terre en août contre une tomate de serre chauffée en février, ce n'est pas la même dépense d'énergie, ni le même goût. Suivre le calendrier des légumes de plein champ, c'est déjà l'essentiel du geste.",
      },
      { t: "h2", id: "ce-qui-est-du-folklore", text: "Ce qui relève du folklore" },
      {
        t: "p",
        text: "L'idée qu'il faudrait bannir tout produit qui n'a pas poussé dans un rayon de vingt kilomètres. Un agrume d'Espagne acheminé par bateau peut avoir une empreinte plus faible qu'une salade locale sous serre. La provenance compte, mais le mode de production compte souvent davantage.",
      },
      {
        t: "list",
        items: [
          "Regarder d'abord si c'est de plein champ ou de serre chauffée.",
          "Se caler sur les légumes racines et les choux l'hiver, sans culpabiliser pour un citron.",
          "Demander au primeur d'où ça vient : la réponse est plus parlante que le mois.",
        ],
      },
      {
        t: "p",
        text: "Le bon niveau d'exigence, c'est celui qu'on tient toute l'année sans y penser. Le reste, c'est de la conversation.",
      },
    ],
  },
  {
    slug: "trois-fromages-que-personne-ne-commande",
    topic: "Découverte",
    title: "Trois fromages que personne ne commande, et c'est dommage",
    excerpt:
      "Portraits courts de mal-aimés, avec les accords qui les remettent en selle.",
    date: "2026-08-06",
    readMin: 4,
    img: IMG.cheese,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    body: [
      {
        t: "p",
        text: "Sur un plateau de restaurant, trois ou quatre fromages tournent toujours. À côté, des pâtes entières restent sur le carreau — non pas parce qu'elles sont moins bonnes, mais parce que personne ne prend le risque. Voici trois candidats à réhabiliter.",
      },
      { t: "h2", id: "la-tomme-fermiere", text: "La tomme fermière de garde" },
      {
        t: "p",
        text: "Trop discrète pour attirer l'œil, elle gagne à être servie un peu plus affinée que d'habitude, avec une bière ambrée plutôt qu'un vin. Un affineur des Hauts-de-France les garde volontairement six mois de plus que la moyenne.",
      },
      { t: "h2", id: "le-cendre-de-chevre", text: "Le cendré de chèvre bien sec" },
      {
        t: "p",
        text: "On le boude quand il est ferme. C'est justement là qu'il est intéressant : cassant, concentré, parfait râpé sur des légumes rôtis ou en fin de repas avec un cidre brut.",
      },
      { t: "h2", id: "la-pate-pressee-cuite", text: "La pâte pressée cuite de petit atelier" },
      {
        t: "p",
        text: "Elle vit dans l'ombre des grands noms. Une version fermière, moins salée, révèle des notes de fruits secs qui la rendent redoutable en cuisine comme en dégustation.",
      },
      {
        t: "quote",
        text: "Les fromages qui ne se vendent pas, ce sont souvent ceux qu'on n'a pas pris le temps de goûter au bon moment.",
        cite: "Un crémier de Lille",
      },
    ],
  },
  {
    slug: "le-bio-est-il-vraiment-meilleur",
    topic: "Impact",
    title: "Le bio est-il vraiment meilleur ? Ça dépend de la question",
    excerpt:
      "Ce que mesurent les labels, ce qu'ils laissent de côté, et comment lire une étiquette.",
    date: "2026-07-31",
    readMin: 7,
    img: IMG.farm3,
    author: "Axelle Vermoesen",
    authorInitials: "AV",
    body: [
      {
        t: "p",
        text: "« Le bio, c'est mieux » : la phrase ferme la discussion au lieu de l'ouvrir. Mieux pour quoi ? Le label AB répond très bien à certaines questions et pas du tout à d'autres.",
      },
      { t: "h2", id: "ce-que-le-label-garantit", text: "Ce que le label garantit" },
      {
        t: "p",
        text: "Pas de pesticides et engrais de synthèse, un cahier des charges sur l'alimentation animale, des contrôles réguliers. Sur la présence de résidus dans l'assiette et sur la vie des sols, l'écart avec le conventionnel est réel et documenté.",
      },
      { t: "h2", id: "ce-quil-ne-dit-pas", text: "Ce qu'il ne dit pas" },
      {
        t: "list",
        items: [
          "La distance parcourue : un produit bio peut venir de très loin.",
          "La taille de l'exploitation et les conditions de travail.",
          "Le bilan carbone global, qui dépend surtout des rendements et du transport.",
        ],
      },
      {
        t: "p",
        text: "Lire une étiquette, c'est donc croiser : le label, l'origine précise, le mode de culture (plein champ, serre), et si possible le nom du producteur. Aucun logo ne remplace ces quatre informations réunies.",
      },
      {
        t: "callout",
        kicker: "En bref",
        items: [
          "Le bio répond bien à la question des résidus et de la vie des sols.",
          "Il ne dit rien de la distance, de la taille de la ferme ni du transport.",
          "L'étiquette utile croise label, origine, mode de culture et producteur.",
        ],
      },
    ],
  },
];

export const EPISODES: Episode[] = [
  {
    slug: "ep-06-palette-de-carottes",
    num: "06",
    topic: "Maraîchage",
    title: "On a suivi une palette de carottes",
    excerpt:
      "Du semis à la cuisine d'un bistrot lyonnais : ce qui se passe entre les deux, et le nombre de mains qui touchent la caisse.",
    guest: "Nadia Cheballah",
    initials: "NC",
    role: "maraîchère, Drôme",
    date: "2026-08-22",
    durationLabel: "42 min",
    clock: "42:10",
    seconds: 2530,
    img: IMG.barrel,
  },
  {
    slug: "ep-05-le-fromage-ne-pardonne-pas",
    num: "05",
    topic: "Fromage",
    title: "Le fromage ne pardonne pas l'approximation",
    excerpt:
      "Les caves, les ratés, et le moment précis où une meule décide de son sort.",
    guest: "Julien Dubois",
    initials: "JD",
    role: "fromager affineur, Jura",
    date: "2026-08-08",
    durationLabel: "38 min",
    clock: "38:24",
    seconds: 2304,
    img: IMG.cheese,
  },
  {
    slug: "ep-04-trois-cuves-le-temps-long",
    num: "04",
    topic: "Brasserie",
    title: "Trois cuves, une seule obsession : le temps long",
    excerpt:
      "Laisser fermenter ce qu'il faut, pas ce qui arrange le calendrier. Et facturer ce que ça coûte.",
    guest: "Marc Sagesse",
    initials: "MS",
    role: "brasseur, Hauts-de-France",
    date: "2026-07-25",
    durationLabel: "46 min",
    clock: "46:02",
    seconds: 2762,
    img: IMG.hand,
  },
  {
    slug: "ep-03-vendre-une-bete",
    num: "03",
    topic: "Élevage",
    title: "Vendre une bête, expliquer trois ans de travail",
    excerpt:
      "La négociation à la carcasse, les abattoirs qui ferment, et pourquoi le prix ne suit jamais.",
    guest: "Claire Vasseur",
    initials: "CV",
    role: "éleveuse, Cantal",
    date: "2026-07-11",
    durationLabel: "51 min",
    clock: "51:18",
    seconds: 3078,
    img: IMG.farm2,
  },
  {
    slug: "ep-02-le-fut-de-chene",
    num: "02",
    topic: "Cidre",
    title: "Le fût de chêne, un choix qui coûte cher",
    excerpt:
      "Pourquoi un cidre passé en fût ne peut pas se vendre au prix d'un cidre industriel, chiffres en main.",
    guest: "Paul Desfriennes",
    initials: "PD",
    role: "cidrier, Normandie",
    date: "2026-06-27",
    durationLabel: "28 min",
    clock: "28:44",
    seconds: 1724,
    img: IMG.barrel,
  },
  {
    slug: "ep-01-pourquoi-matieres-premieres",
    num: "01",
    topic: "Coulisses",
    title: "Pourquoi je parle de matières premières",
    excerpt:
      "L'origine de la newsletter, et pourquoi la transparence alimentaire mérite mieux qu'un logo sur un emballage.",
    guest: "Axelle Vermoesen",
    initials: "AV",
    role: "fondatrice",
    date: "2026-06-13",
    durationLabel: "21 min",
    clock: "21:47",
    seconds: 1307,
    img: IMG.cheese,
  },
];

export const ARTICLE_TOPICS = ["Tout", ...Array.from(new Set(ARTICLES.map((a) => a.topic)))];
export const EPISODE_TOPICS = ["Tout", ...Array.from(new Set(EPISODES.map((e) => e.topic)))];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function frDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
