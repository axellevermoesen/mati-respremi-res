import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

const STEPS = [
  {
    num: "01",
    title: "Vous commandez à plusieurs producteurs",
    body: "Fromage du Jura, cidre normand, légumes de saison — un seul panier, un seul paiement.",
  },
  {
    num: "02",
    title: "Les producteurs mutualisent la tournée",
    body: "Ceux d'une même région se coordonnent entre eux pour livrer ensemble, le même jour.",
  },
  {
    num: "03",
    title: "Vous recevez, une fois, tout le monde",
    body: "Un seul créneau de livraison en cuisine. Zéro camion supplémentaire dans la cour.",
  },
];

const CATALOGUE = [
  { image: "/img/cheese-wheels-aging.jpeg", eyebrow: "Jura", title: "Comté 18 mois", subtitle: "Fromagerie Dubois" },
  { image: "/img/barrel-cellar-wide.jpeg", eyebrow: "Normandie", title: "Cidre brut fût de chêne", subtitle: "Cidrerie Desfriennes" },
  { image: "/img/producer-hand-barrel.jpeg", eyebrow: "Hauts-de-France", title: "Bière de garde ambrée", subtitle: "La Brasserie Sagesse" },
  { image: "/img/farm-2.jpeg", eyebrow: "Émilie-Romagne", title: "Parmigiano Reggiano DOP 24 mois", subtitle: "Caseificio Rossi" },
];

const ARTICLES = [
  { title: "Pourquoi votre comté met 18 mois à devenir bon", meta: "Filière · 6 min de lecture" },
  { title: "Mutualiser sa tournée : ce que ça change vraiment sur la facture", meta: "Logistique · 4 min de lecture" },
  { title: "Cuisiner de saison en février : le guide", meta: "Cuisine · 8 min de lecture" },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative flex h-[640px] items-end">
          <Image
            src="/img/barrel-cellar-wide.jpeg"
            alt="Cave d'un producteur"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(150_30%_8%_/_0.82),hsl(150_30%_8%_/_0.15)_55%,transparent_75%)]" />
          <Container className="relative pb-16">
            <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-300">
              Producteurs × restaurants indépendants
            </div>
            <h1 className="mt-4 max-w-[820px] font-display text-[clamp(36px,4.5vw,60px)] leading-[var(--leading-tight)] text-white">
              Une seule commande.
              <br />
              Une seule livraison.
              <br />
              Des dizaines de producteurs.
            </h1>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[var(--leading-relaxed)] text-[hsl(45_30%_96%_/_0.85)]">
              Matières Premières mutualise les commandes et les tournées entre
              producteurs pour que votre cuisine reçoive du direct-producteur,
              sans la logistique de vingt fournisseurs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Button href="/catalogue" size="lg">
                Voir le catalogue
              </Button>
              <Button href="/connexion?role=producteur" size="lg" variant="secondary">
                Je suis producteur
              </Button>
            </div>
          </Container>
        </section>

        {/* COMMENT CA MARCHE */}
        <Container as="section" className="py-24">
          <h2 className="max-w-[640px] font-display text-[var(--text-display-m)]">
            Comment ça marche
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
            Trois étapes, une seule tournée de camion.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num}>
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-m)] bg-[var(--rose-100)] font-display text-[18px] text-green-900">
                  {step.num}
                </div>
                <h3 className="mt-5 text-[18px] font-bold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>

        {/* PORTRAIT DE PRODUCTEUR */}
        <section className="bg-[var(--surface-sunken)] py-24">
          <Container>
            <div className="mb-10 flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Portrait de producteur
                </div>
                <h2 className="mt-2 font-display text-[var(--text-display-m)]">
                  La vitrine, pas juste la fiche produit
                </h2>
              </div>
              <Link href="/producteurs" className="mp-nav-link whitespace-nowrap">
                Tous les producteurs →
              </Link>
            </div>
            <div className="grid overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-card)] shadow-[var(--shadow-l)] lg:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-[420px]">
                <Image
                  src="/img/producer-hand-barrel.jpeg"
                  alt="La Brasserie Sagesse"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-12">
                <Badge tone="brand" className="self-start">
                  Producteur vérifié
                </Badge>
                <h3 className="mt-4 font-display text-[34px] text-[var(--text-primary)]">
                  La Brasserie Sagesse
                </h3>
                <div className="mt-1 text-[14px] text-[var(--text-muted)]">
                  Bières de garde artisanales · Lille, Hauts-de-France
                </div>
                <p className="mt-5 text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                  Trois cuves, une seule obsession : le temps long. La Sagesse
                  laisse fermenter ce qu'il faut, pas ce qui arrange le
                  calendrier. Résultat : des bières de garde qui tiennent tête à
                  n'importe quelle carte des vins.
                </p>
                <div className="mt-7 flex gap-7">
                  {[
                    ["2019", "Fondée en"],
                    ["12", "Bières au catalogue"],
                    ["3", "Producteurs alliés"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <div className="font-display text-[22px] text-green-900">{value}</div>
                      <div className="text-[12px] text-[var(--text-muted)]">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Button href="/producteurs/la-brasserie-sagesse" variant="secondary">
                    Découvrir la brasserie
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* LE RESEAU */}
        <Container as="section" className="py-24">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Le réseau
          </div>
          <h2 className="mt-2 max-w-[680px] font-display text-[var(--text-display-m)] text-green-900">
            Les producteurs se recommandent entre eux
          </h2>
          <p className="mt-3 max-w-[600px] text-[16px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
            Chaque profil producteur montre avec qui il mutualise déjà sa tournée
            — et qui il vous conseille pour compléter votre commande.
          </p>

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
            {/* Recommandations */}
            <div>
              <div className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Recommandations depuis le profil
              </div>
              <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
                <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 font-display text-[14px] text-sand-50">
                    BS
                  </span>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)]">
                      La Brasserie Sagesse
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)]">
                      recommande 3 producteurs
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3.5 pt-4">
                  {[
                    ["FD", "Fromagerie Dubois", "« Leur comté tient une carte à lui seul. »"],
                    ["CD", "Cidrerie Desfriennes", "« On partage le camion depuis 2021. »"],
                  ].map(([initials, name, quote]) => (
                    <div key={name} className="flex items-center gap-3 rounded-[var(--radius-m)] border border-[var(--border-subtle)] p-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-200 font-display text-[12px] text-green-900">
                        {initials}
                      </span>
                      <div>
                        <div className="text-[14px] font-semibold text-[var(--text-primary)]">{name}</div>
                        <div className="text-[12px] text-[var(--text-muted)]">{quote}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* La tournée mutualisée */}
            <div>
              <div className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                La tournée mutualisée
              </div>
              <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
                <div className="flex items-center justify-between">
                  {["La Sagesse", "Dubois", "Desfriennes"].map((name, i) => (
                    <div key={name} className="flex flex-1 flex-col items-center gap-2">
                      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--rose-100)] font-display text-[13px] text-green-900">
                        {i + 1}
                      </span>
                      <span className="text-center text-[12px] font-semibold text-[var(--text-primary)]">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="my-4 text-center text-[var(--sand-400)]">↓</div>
                <div className="flex items-center gap-3.5 rounded-[var(--radius-m)] bg-[var(--accent-secondary-hover)] px-5 py-4">
                  <span className="text-[22px]">🚚</span>
                  <div>
                    <div className="text-[14px] font-bold text-white">Une tournée, mardi matin</div>
                    <div className="text-[12px] text-[hsl(45_30%_96%_/_0.75)]">
                      3 producteurs, 1 livraison, votre cuisine
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* CATALOGUE TEASER */}
        <section className="bg-[var(--surface-sunken)] py-24">
          <Container>
            <div className="mb-9 flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Le catalogue
                </div>
                <h2 className="mt-2 font-display text-[var(--text-display-m)]">
                  128 produits, 24 producteurs
                </h2>
              </div>
              <Link href="/catalogue" className="mp-nav-link whitespace-nowrap">
                Voir tout le catalogue →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CATALOGUE.map((p) => (
                <Card
                  key={p.title}
                  image={p.image}
                  imageAlt={p.title}
                  eyebrow={p.eyebrow}
                  title={p.title}
                  subtitle={p.subtitle}
                  href="/catalogue"
                />
              ))}
            </div>
          </Container>
        </section>

        {/* MANIFESTE */}
        <section className="bg-green-900 px-[var(--container-pad)] py-28 text-center">
          <div className="mx-auto max-w-[760px]">
            <p className="font-display text-[clamp(26px,3vw,38px)] leading-[var(--leading-snug)] text-white">
              Un fournisseur de moins à gérer n'est jamais un producteur de moins
              dans votre assiette.
            </p>
            <div className="mt-6 text-[15px] text-[var(--rose-100)]">
              On mutualise la logistique. Pas le goût.
            </div>
          </div>
        </section>

        {/* BLOG / PODCAST */}
        <Container as="section" className="py-24">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="text-[18px]">📖</span>
                <h2 className="font-display text-[20px]">Le blog</h2>
              </div>
              <div className="flex flex-col">
                {ARTICLES.map((a) => (
                  <Link
                    key={a.title}
                    href="/blog"
                    className="group border-b border-[var(--border-subtle)] py-[18px]"
                  >
                    <div className="text-[15px] font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--text-brand)]">
                      {a.title}
                    </div>
                    <div className="mt-1.5 text-[12px] text-[var(--text-muted)]">{a.meta}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="text-[18px]">🎧</span>
                <h2 className="font-display text-[20px]">Le podcast</h2>
              </div>
              <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
                <Badge tone="secondary">Épisode 12</Badge>
                <h3 className="mt-3 font-display text-[20px] text-[var(--text-primary)]">
                  Le prix juste, vu du champ
                </h3>
                <p className="mt-2 text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                  Trois maraîchers racontent comment ils fixent leurs tarifs — et
                  ce que la vente directe change vraiment.
                </p>
                <div className="mt-4">
                  <Button href="/podcast" variant="outline" size="sm">
                    Écouter l'épisode
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
