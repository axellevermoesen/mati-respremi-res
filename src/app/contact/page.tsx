import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question sur une commande, un producteur à nous présenter, une tournée à monter dans votre région : écrivez-nous.",
};

const CONTACT_EMAIL = "axelle.vermoesen@gmail.com";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex min-h-[380px] items-center overflow-hidden">
        <Image
          src="/img/producer-hand-barrel.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(150_30%_16%_/_0.88)] via-[hsl(150_30%_16%_/_0.62)] to-[hsl(150_30%_16%_/_0.08)]" />
        <div className="relative mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)]">
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            Contact
          </div>
          <h1 className="mt-4 max-w-[640px] text-pretty font-display text-[clamp(30px,4.2vw,48px)] leading-[var(--leading-tight)] text-white">
            Derrière chaque livraison, quelqu&apos;un qui décroche.
          </h1>
          <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-[hsl(45_30%_96%_/_0.9)]">
            Une question sur une commande, un producteur à nous présenter, une tournée à
            monter dans votre région : écrivez-nous. On répond en moins de 24 h ouvrées.
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-9 px-[var(--container-pad)] py-16 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <ContactForm />

        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Écrire
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 block text-[17px] font-semibold text-green-900 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Pour tout le reste — on lit vraiment.
            </p>
          </div>

          <div className="rounded-[var(--radius-l)] bg-green-900 p-8 text-white">
            <h3 className="font-display text-[20px] leading-snug">
              Vous produisez quelque chose de bon ?
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--rose-100)]">
              On ouvre une tournée dès qu&apos;il y a assez de cuisines autour de vous.
              Racontez-nous votre ferme, votre atelier, votre cave.
            </p>
            <div className="mt-5">
              <Button href="/connexion?role=producteur" variant="secondary">
                Rejoindre les producteurs
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)]">
            <h3 className="font-display text-[20px] leading-snug text-green-900">
              Vous cuisinez, vous cherchez mieux ?
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Dites-nous ce que vous servez et où vous êtes. On regarde quels producteurs
              passent déjà devant votre porte.
            </p>
            <div className="mt-5">
              <Button href="/connexion">Ouvrir un compte restaurant</Button>
            </div>
          </div>

          <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)]">
            <h3 className="font-display text-[18px] text-green-900">La lettre</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Une fois par mois : les produits de saison, les nouveaux producteurs,
              zéro bla-bla — sur Substack.
            </p>
            <form
              action="https://axellevermoesen.substack.com/subscribe"
              method="get"
              target="_blank"
              className="mt-4 flex flex-wrap items-end gap-2.5"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Votre email"
                className="h-[46px] min-w-[160px] flex-1 rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 text-[15px] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none placeholder:text-[var(--text-muted)] focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
              />
              <Button type="submit" variant="secondary" className="h-[46px]">
                S&apos;inscrire
              </Button>
            </form>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
