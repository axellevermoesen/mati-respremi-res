import Link from "next/link";

const COLUMNS = [
  {
    title: "La marketplace",
    links: [
      { label: "Catalogue", href: "/catalogue" },
      { label: "Producteurs", href: "/producteurs" },
      { label: "Réseau de livraison", href: "/reseau" },
      { label: "Devenir producteur", href: "/connexion?role=producteur" },
    ],
  },
  {
    title: "Contenu",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Podcast", href: "/podcast" },
      { label: "Ressources", href: "/ressources" },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Notre mission", href: "/a-propos" },
      { label: "Nous contacter", href: "/contact" },
      { label: "FAQ", href: "/aide/faq" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGU", href: "/legal/cgu" },
      { label: "Mentions légales", href: "/legal/mentions" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-green-900 text-[var(--text-inverse)]">
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-[280px]">
            <div className="font-display text-[18px]">Matières Premières</div>
            <p className="mt-3 text-[13px] leading-[var(--leading-relaxed)] text-[hsl(45_30%_96%_/_0.7)]">
              On mutualise la logistique entre producteurs et restaurants.
              Pas le goût.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[hsl(45_30%_96%_/_0.55)]">
                {col.title}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[hsl(45_30%_96%_/_0.85)] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-[hsl(45_30%_96%_/_0.15)] pt-6 text-[12px] text-[hsl(45_30%_96%_/_0.55)]">
          © {new Date().getFullYear()} Matières Premières. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
