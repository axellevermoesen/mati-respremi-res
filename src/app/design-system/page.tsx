import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Design system",
};

const COLORS: { name: string; token: string; value: string }[] = [
  { name: "green-900", token: "--green-900", value: "#2D4839" },
  { name: "green-700", token: "--green-700", value: "#426E55" },
  { name: "green-500", token: "--green-500", value: "#73986F" },
  { name: "rose-600", token: "--rose-600", value: "#CB748E" },
  { name: "rose-300", token: "--rose-300", value: "#D698AB" },
  { name: "rose-100", token: "--rose-100", value: "#EED4DB" },
  { name: "sand-50", token: "--sand-50", value: "#FAF7F2" },
  { name: "sand-100", token: "--sand-100", value: "#F3EEE5" },
  { name: "sand-200", token: "--sand-200", value: "#E6DFD2" },
  { name: "sand-400", token: "--sand-400", value: "#B7AE9C" },
  { name: "ink-900", token: "--ink-900", value: "#1E2420" },
  { name: "ink-700", token: "--ink-700", value: "#3A4540" },
  { name: "amber-600", token: "--amber-600", value: "#C98A3E" },
  { name: "terracotta-600", token: "--terracotta-600", value: "#B8503F" },
];

const TYPE_SAMPLES: { label: string; className: string; sample: string }[] = [
  { label: "display-xl · Space Mono", className: "font-display text-[var(--text-display-xl)]", sample: "Matières Premières" },
  { label: "display-m · Space Mono", className: "font-display text-[var(--text-display-m)]", sample: "Une seule livraison" },
  { label: "heading-m · Manrope 700", className: "font-body text-[var(--text-heading-m)] font-bold", sample: "Comment ça marche" },
  { label: "body-l · Manrope 400", className: "font-body text-[var(--text-body-l)]", sample: "On mutualise la logistique entre producteurs et restaurants." },
  { label: "body-s · Manrope 400", className: "font-body text-[var(--text-body-s)]", sample: "Livraison groupée le mardi matin." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--border-subtle)] py-12">
      <h2 className="mb-6 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="py-16">
      <Container>
        <p className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
          Circuit Court
        </p>
        <h1 className="mt-2 font-display text-[var(--text-display-l)]">
          Design system
        </h1>
        <p className="mt-3 max-w-[560px] text-[var(--text-secondary)]">
          Les briques visuelles de Matières Premières : couleurs, typographie et
          composants de base. Cette page sert de référence pendant la
          construction.
        </p>

        <Section title="Couleurs">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {COLORS.map((c) => (
              <div
                key={c.name}
                className="overflow-hidden rounded-[var(--radius-m)] border border-[var(--border-subtle)] bg-white"
              >
                <div className="h-20" style={{ background: c.value }} />
                <div className="p-3">
                  <div className="font-mono text-[12px] font-bold text-[var(--text-primary)]">
                    {c.name}
                  </div>
                  <div className="text-[12px] text-[var(--text-muted)]">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typographie">
          <div className="flex flex-col gap-6">
            {TYPE_SAMPLES.map((t) => (
              <div key={t.label}>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  {t.label}
                </div>
                <div className={t.className}>{t.sample}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Boutons">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Voir le catalogue</Button>
            <Button variant="secondary">Je suis producteur</Button>
            <Button variant="outline">Espace producteur</Button>
            <Button variant="ghost">En savoir plus</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg">Grand</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">Producteur vérifié</Badge>
            <Badge tone="neutral">Nouveau</Badge>
            <Badge tone="secondary">Épisode 12</Badge>
            <Badge tone="success">En stock</Badge>
            <Badge tone="warning">Stock bas</Badge>
            <Badge tone="danger">Rupture</Badge>
          </div>
        </Section>

        <Section title="Cartes produit">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              image="/img/cheese-wheels-aging.jpeg"
              imageAlt="Comté"
              eyebrow="Jura"
              title="Comté 18 mois"
              subtitle="Fromagerie Dubois"
              href="/catalogue"
            />
            <Card
              image="/img/barrel-cellar-wide.jpeg"
              imageAlt="Cidre"
              eyebrow="Normandie"
              title="Cidre brut fût de chêne"
              subtitle="Cidrerie Desfriennes"
              href="/catalogue"
            />
            <Card
              image="/img/producer-hand-barrel.jpeg"
              imageAlt="Bière"
              eyebrow="Hauts-de-France"
              title="Bière de garde ambrée"
              subtitle="La Brasserie Sagesse"
              href="/catalogue"
            />
          </div>
        </Section>
      </Container>
    </main>
  );
}
