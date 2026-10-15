"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { saveHomeContent, uploadHomeImage } from "@/lib/actions/admin-home";
import { DEFAULT_HOME, type HomeContent } from "@/lib/home-content";
import { cn } from "@/lib/cn";

type Option = { id: string; label: string };
type SectionKey = keyof HomeContent;

/** Éditeur de la page d'accueil : une carte par section, dans l'ordre de la page. */
export function HomeEditor({
  initial,
  producers,
  products,
}: {
  initial: HomeContent;
  producers: (Option & { hasCover: boolean })[];
  products: Option[];
}) {
  const router = useRouter();
  const [c, setC] = useState<HomeContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  /** Met à jour un champ d'une section. */
  function set<K extends SectionKey>(key: K, patch: Partial<HomeContent[K]>) {
    setC((x) => ({ ...x, [key]: { ...x[key], ...patch } }));
    setDirty(true);
    setMsg(undefined);
  }

  function resetSection<K extends SectionKey>(key: K) {
    setC((x) => ({ ...x, [key]: structuredClone(DEFAULT_HOME[key]) }));
    setDirty(true);
    setMsg(undefined);
  }

  const save = () =>
    start(async () => {
      const res = await saveHomeContent(c);
      if ("error" in res) setMsg({ ok: false, text: res.error });
      else {
        setDirty(false);
        setMsg({ ok: true, text: "Enregistré : la page d'accueil est à jour." });
        router.refresh();
      }
    });

  const section = <K extends SectionKey>(key: K, title: string, hint: string) => ({
    title,
    hint,
    show: c[key].show,
    onShow: (v: boolean) => set(key, { show: v } as Partial<HomeContent[K]>),
    onReset: () => resetSection(key),
  });

  return (
    <div className="pb-28">
      <div className="mt-6 flex flex-col gap-5">
        <Section {...section("hero", "1. Bandeau du haut", "La grande image et le titre en arrivant sur le site.")}>
          <ImageField
            label="Image de fond"
            slot="hero"
            value={c.hero.image}
            onChange={(image) => set("hero", { image })}
          />
          <Text label="Petit sur-titre" value={c.hero.kicker} onChange={(kicker) => set("hero", { kicker })} />
          <Area
            label="Titre"
            hint="Chaque retour à la ligne apparaît aussi sur le site."
            rows={3}
            value={c.hero.title}
            onChange={(title) => set("hero", { title })}
          />
          <Area label="Texte" rows={3} value={c.hero.text} onChange={(text) => set("hero", { text })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LinkField
              label="Bouton principal (vert)"
              value={c.hero.primary}
              onChange={(primary) => set("hero", { primary })}
            />
            <LinkField
              label="Bouton secondaire (rose)"
              value={c.hero.secondary}
              onChange={(secondary) => set("hero", { secondary })}
            />
          </div>
        </Section>

        <Section {...section("steps", "2. Comment ça marche", "Les 3 étapes numérotées.")}>
          <Text label="Titre" value={c.steps.title} onChange={(title) => set("steps", { title })} />
          <Text label="Sous-titre" value={c.steps.subtitle} onChange={(subtitle) => set("steps", { subtitle })} />
          {c.steps.items.map((it, i) => (
            <div key={i} className="grid gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-4">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Étape {i + 1}
              </div>
              <Text
                label="Titre"
                value={it.title}
                onChange={(title) =>
                  set("steps", { items: c.steps.items.map((x, j) => (j === i ? { ...x, title } : x)) })
                }
              />
              <Area
                label="Texte"
                rows={2}
                value={it.body}
                onChange={(body) =>
                  set("steps", { items: c.steps.items.map((x, j) => (j === i ? { ...x, body } : x)) })
                }
              />
            </div>
          ))}
        </Section>

        <Section
          {...section("portrait", "3. Producteur à la une", "Un producteur mis en avant, avec un lien vers sa page.")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Petit sur-titre" value={c.portrait.kicker} onChange={(kicker) => set("portrait", { kicker })} />
            <Text label="Titre" value={c.portrait.title} onChange={(title) => set("portrait", { title })} />
          </div>
          <Choice
            label="Producteur"
            value={c.portrait.producerId}
            onChange={(producerId) => set("portrait", { producerId })}
            empty="Automatique (un producteur avec photo de couverture)"
            options={producers.map((p) => ({
              id: p.id,
              label: p.hasCover ? p.label : `${p.label} (sans photo de couverture)`,
            }))}
          />
          <Area
            label="Texte de présentation"
            hint="Laissez vide pour reprendre l'accroche du producteur (sa page « Ma page »)."
            rows={4}
            value={c.portrait.text}
            onChange={(text) => set("portrait", { text })}
          />
          <ImageField
            label="Photo"
            hint="Laissez vide pour reprendre la photo de couverture du producteur."
            slot="portrait"
            value={c.portrait.image}
            onChange={(image) => set("portrait", { image })}
          />
        </Section>

        <Section
          {...section("network", "4. Le réseau", "Le texte au-dessus de l'illustration « recommandations / tournée ».")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Petit sur-titre" value={c.network.kicker} onChange={(kicker) => set("network", { kicker })} />
            <Text label="Titre" value={c.network.title} onChange={(title) => set("network", { title })} />
          </div>
          <Area label="Texte" rows={3} value={c.network.text} onChange={(text) => set("network", { text })} />
        </Section>

        <Section {...section("catalogue", "5. Aperçu du catalogue", "4 produits mis en avant.")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Petit sur-titre"
              value={c.catalogue.kicker}
              onChange={(kicker) => set("catalogue", { kicker })}
            />
            <Text
              label="Titre"
              hint="{produits} devient « 12 produits », {producteurs} devient « 3 producteurs » (chiffres à jour)."
              value={c.catalogue.title}
              onChange={(title) => set("catalogue", { title })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Choice
                key={i}
                label={`Produit ${i + 1}`}
                value={c.catalogue.productIds[i] ?? ""}
                empty={i === 0 ? "Automatique (les 4 derniers produits avec photo)" : "—"}
                options={products}
                onChange={(id) => {
                  const ids = [0, 1, 2, 3].map((j) => (j === i ? id : (c.catalogue.productIds[j] ?? "")));
                  set("catalogue", { productIds: ids.filter(Boolean) });
                }}
              />
            ))}
          </div>
        </Section>

        <Section {...section("manifesto", "6. Citation", "Le grand bandeau vert avec une phrase forte.")}>
          <Area label="Citation" rows={3} value={c.manifesto.quote} onChange={(quote) => set("manifesto", { quote })} />
          <Text
            label="Signature"
            value={c.manifesto.signature}
            onChange={(signature) => set("manifesto", { signature })}
          />
        </Section>

        <Section
          {...section(
            "content",
            "7. Blog et podcast",
            "Les 3 derniers articles et le dernier épisode publiés s'affichent tout seuls.",
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Text
              label="Titre côté blog"
              value={c.content.blogTitle}
              onChange={(blogTitle) => set("content", { blogTitle })}
            />
            <Text
              label="Titre côté podcast"
              value={c.content.podcastTitle}
              onChange={(podcastTitle) => set("content", { podcastTitle })}
            />
          </div>
        </Section>
      </div>

      {/* Barre d'enregistrement */}
      <div className="fixed bottom-0 left-[248px] right-0 z-20 border-t border-[var(--border-subtle)] bg-[hsl(45_30%_98%_/_0.95)] px-10 py-4 backdrop-blur">
        <div className="flex max-w-[880px] flex-wrap items-center gap-4">
          <Button type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button href="/" variant="ghost" target="_blank">
            Voir la page d&apos;accueil ↗
          </Button>
          {msg ? (
            <span
              role="status"
              className={cn("text-[14px] font-semibold", msg.ok ? "text-green-700" : "text-[var(--state-danger)]")}
            >
              {msg.text}
            </span>
          ) : (
            dirty && <span className="text-[13px] text-[var(--text-muted)]">Modifications non enregistrées</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  hint,
  show,
  onShow,
  onReset,
  children,
}: {
  title: string;
  hint: string;
  show: boolean;
  onShow: (v: boolean) => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[18px] text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">{hint}</p>
        </div>
        <label className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--text-secondary)]">
          <Switch checked={show} onChange={onShow} label={`Afficher : ${title}`} />
          {show ? "Affichée" : "Masquée"}
        </label>
      </div>
      <div className={cn("mt-5 flex flex-col gap-4", !show && "opacity-50")}>{children}</div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
      >
        Rétablir les textes d&apos;origine de cette section
      </button>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="mp-lab">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

function Text({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className="mp-in" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Area({
  label,
  hint,
  rows,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  rows: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea className="mp-in" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Choice({
  label,
  value,
  empty,
  options,
  onChange,
}: {
  label: string;
  value: string;
  empty: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select className="mp-in" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function LinkField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; href: string };
  onChange: (v: { label: string; href: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-4">
      <span className="mp-lab">{label}</span>
      <input
        className="mp-in"
        placeholder="Texte du bouton (vide = pas de bouton)"
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
      />
      <input
        className="mp-in"
        placeholder="/catalogue"
        value={value.href}
        onChange={(e) => onChange({ ...value, href: e.target.value })}
      />
    </div>
  );
}

function ImageField({
  label,
  hint,
  slot,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  slot: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();

  const pick = (file: File) => {
    setError(undefined);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("slot", slot);
    start(async () => {
      const res = await uploadHomeImage(fd);
      if ("error" in res) setError(res.error);
      else onChange(res.url);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="mp-lab">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <span className="relative h-[90px] w-[160px] shrink-0 overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]">
          {value ? (
            <Image src={value} alt="" fill sizes="160px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center text-[12px] text-[var(--text-muted)]">
              Aucune
            </span>
          )}
        </span>
        <div className="flex flex-col items-start gap-1">
          <button type="button" className="mp-add" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Envoi…" : value ? "Remplacer l'image" : "+ Choisir une image"}
          </button>
          {value && (
            <button
              type="button"
              className="px-3.5 text-[12px] font-semibold text-[var(--text-muted)] hover:underline"
              onClick={() => onChange("")}
            >
              Retirer
            </button>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = "";
          }}
        />
      </div>
      {hint && <span className="text-[12px] text-[var(--text-muted)]">{hint}</span>}
      {error && <span className="text-[12px] text-[var(--state-danger)]">{error}</span>}
    </div>
  );
}
