import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { NewsletterBand } from "@/components/site/NewsletterBand";
import { Button } from "@/components/ui/Button";
import { getVisibleEpisodes } from "@/lib/content-queries";
import { PodcastHub } from "./PodcastHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le podcast",
  description:
    "Un producteur, une heure, zéro langue de bois. On parle du métier, des prix, des ratés et de ce qui finit dans ton assiette.",
};

export default async function PodcastPage() {
  const episodes = await getVisibleEpisodes();
  const topics = ["Tout", ...Array.from(new Set(episodes.map((e) => e.topic)))];

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex min-h-[520px] items-end">
        <Image
          src="/img/cheese-wheels-aging.jpeg"
          alt="Meules en cours d'affinage"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(150_30%_8%_/_0.88)] via-[hsl(150_30%_8%_/_0.24)] to-transparent" />
        <div className="relative mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-16">
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            Le podcast de Matières Premières
          </div>
          <h1 className="mt-4 font-display text-[clamp(40px,6vw,72px)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)] text-white">
            Circuit Court,
          </h1>
          <div className="mt-1.5 font-display text-[clamp(20px,2.4vw,30px)] leading-[var(--leading-snug)] text-[var(--rose-300,#d698ab)]">
            des gens qui savent de quoi ils parlent.
          </div>
          <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-[hsl(45_30%_96%_/_0.85)]">
            Un producteur, une heure, zéro langue de bois. On parle du métier, des prix, des ratés
            et de ce qui finit dans ton assiette.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Button href="#episodes" size="lg" variant="secondary">
              Écouter le dernier épisode
            </Button>
            <Button
              href="#episodes"
              size="lg"
              variant="outline"
              className="border-white/60 bg-white/10 text-white hover:bg-white/20"
            >
              S&apos;abonner sur Spotify
            </Button>
          </div>
        </div>
      </section>

      <div id="episodes">
        {episodes.length > 0 ? (
          <PodcastHub episodes={episodes} topics={topics} />
        ) : (
          <p className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-24 text-[var(--text-muted)]">
            Aucun épisode pour l&apos;instant, revenez bientôt.
          </p>
        )}
      </div>

      {/* Proposer un épisode */}
      <section className="bg-green-900 px-[var(--container-pad)] py-28 text-center">
        <div className="mx-auto max-w-[760px]">
          <p className="font-display text-[clamp(24px,3vw,36px)] leading-[var(--leading-snug)] text-white">
            Vous produisez quelque chose dont vous êtes fier ? On a une heure et un micro.
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-[var(--rose-100)]">
            On enregistre chez vous, dans l&apos;atelier ou dans le champ. Pas de plateau, pas de
            maquillage.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="mailto:podcast@matieres-premieres.fr" size="lg" variant="secondary">
              Proposer un épisode
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] py-24">
        <NewsletterBand
          tone="sand"
          title="Le nouvel épisode, dans ta boîte mail le jeudi."
          text=""
        />
      </div>

      <SiteFooter />
    </>
  );
}
