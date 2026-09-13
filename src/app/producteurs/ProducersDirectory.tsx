"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export type DirRow = {
  slug: string;
  nom: string;
  cat: string;
  ville: string;
  region: string;
  prod: string;
  tags: string[];
  bio: boolean;
  nouveau: boolean;
  dispo: boolean;
  depuis: number | null;
  coverUrl: string;
  produits: number;
  mini: string | null;
  livraison: string;
};

type Tri = "recents" | "alpha" | "produits";
const TRIS: { key: Tri; label: string }[] = [
  { key: "recents", label: "Récents" },
  { key: "produits", label: "Catalogue fourni" },
  { key: "alpha", label: "A → Z" },
];

const ENGAGEMENTS: { key: "bio" | "dispo" | "nouveau"; label: string }[] = [
  { key: "bio", label: "Bio & labels" },
  { key: "dispo", label: "Accepte des clients" },
  { key: "nouveau", label: "Arrivés récemment" },
];

const FAV_KEY = "mp:producteurs:favoris";

export function ProducersDirectory({ producers }: { producers: DirRow[] }) {
  const [cats, setCats] = useState<string[]>([]);
  const [eng, setEng] = useState<string[]>([]);
  const [tri, setTri] = useState<Tri>("recents");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [favOnly, setFavOnly] = useState(false);

  // Les favoris vivent dans le navigateur : on les lit après le montage
  // (localStorage n'existe pas au rendu serveur).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavs(JSON.parse(raw));
      }
    } catch {
      /* pas de localStorage : on reste sans favoris */
    }
  }, []);

  function toggleFav(slug: string) {
    setFavs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const categories = useMemo(
    () => [...new Set(producers.map((p) => p.cat))].sort((a, b) => a.localeCompare(b, "fr")),
    [producers],
  );

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = producers.filter((p) => {
      if (cats.length && !cats.includes(p.cat)) return false;
      if (eng.includes("bio") && !p.bio) return false;
      if (eng.includes("dispo") && !p.dispo) return false;
      if (eng.includes("nouveau") && !p.nouveau) return false;
      if (favOnly && !favs.includes(p.slug)) return false;
      if (
        needle &&
        !`${p.nom} ${p.ville} ${p.region} ${p.cat} ${p.prod} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      if (tri === "alpha") return a.nom.localeCompare(b.nom, "fr");
      if (tri === "produits") return b.produits - a.produits;
      return (b.depuis ?? 0) - (a.depuis ?? 0);
    });
    return out;
  }, [producers, cats, eng, favOnly, favs, q, tri]);

  const reset = () => {
    setCats([]);
    setEng([]);
    setQ("");
    setFavOnly(false);
    setTri("recents");
  };

  return (
    <main className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-24 pt-10">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
            Annuaire
          </div>
          <h1 className="mt-2.5 font-display text-[var(--text-display-m)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
            Nos producteurs
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Des fermes, des ateliers, des bateaux. Tous à moins de deux heures de votre cuisine,
            tous joignables par téléphone.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button href="/reseau" variant="outline">
            Voir la carte du réseau
          </Button>
          <Button href="/inscription/producteur">Devenir producteur</Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="mt-8 flex flex-col gap-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="min-w-[220px] max-w-[360px] flex-1">
            <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Rechercher
            </span>
            <input
              className="mp-in w-full"
              value={q}
              placeholder="Un nom, une ville, un produit"
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Trier par
              </span>
              <div className="flex gap-1 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-1">
                {TRIS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTri(t.key)}
                    className={cn(
                      "whitespace-nowrap rounded-[var(--radius-s)] px-3 py-2 text-[13px] font-semibold",
                      tri === t.key
                        ? "bg-[var(--surface-card)] text-green-900 shadow-[var(--shadow-s)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                Mes favoris
              </span>
              <button
                type="button"
                onClick={() => setFavOnly((v) => !v)}
                className={cn(
                  "flex h-11 items-center gap-2.5 rounded-[var(--radius-m)] px-4 text-[13px] font-bold",
                  favOnly
                    ? "bg-[var(--rose-100)] text-green-900 shadow-[inset_0_0_0_1.5px_var(--rose-600)]"
                    : "text-[var(--text-secondary)] shadow-[inset_0_0_0_1.5px_var(--border-subtle)]",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    favOnly ? "bg-rose-600" : "bg-[var(--sand-400)]",
                  )}
                />
                Favoris {favs.length}
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--border-subtle)]" />

        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-[260px] flex-1">
            <div className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Catégories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const on = cats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(cats, setCats, c)}
                    className={cn(
                      "rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-semibold",
                      on
                        ? "bg-green-900 text-white"
                        : "bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]",
                    )}
                  >
                    {c}{" "}
                    <span className="opacity-60">
                      {producers.filter((p) => p.cat === c).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Engagements
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ENGAGEMENTS.map((e) => {
                const on = eng.includes(e.key);
                return (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => toggle(eng, setEng, e.key)}
                    className={cn(
                      "rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-semibold",
                      on
                        ? "bg-green-900 text-white"
                        : "bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]",
                    )}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="mt-6 flex items-baseline justify-between gap-4">
        <div className="font-display text-[var(--text-heading-s)] text-green-900">
          {rows.length} producteur{rows.length > 1 ? "s" : ""} sur {producers.length}
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Tout réinitialiser
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-l)] bg-[var(--surface-sunken)] p-10 text-center">
          <div className="font-display text-[var(--text-heading-m)] text-green-900">
            Rien ne sort du panier, là.
          </div>
          <p className="mx-auto mt-2.5 max-w-[420px] text-[14px] text-[var(--text-secondary)]">
            Vos filtres sont un peu sévères. Enlevez-en un ou deux et le terroir revient.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(288px,1fr))]">
          {rows.map((p) => (
            <ProducerCard
              key={p.slug}
              p={p}
              fav={favs.includes(p.slug)}
              onFav={() => toggleFav(p.slug)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ProducerCard({ p, fav, onFav }: { p: DirRow; fav: boolean; onFav: () => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)] transition-shadow hover:shadow-[var(--shadow-l)]">
      <div className="relative h-[176px] shrink-0 bg-[var(--surface-sunken)]">
        {p.coverUrl ? (
          <Image
            src={p.coverUrl}
            alt={p.nom}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-700 to-green-900 px-4 text-center font-display text-[15px] text-white">
            {p.cat}
          </div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.bio && (
            <span className="rounded-[var(--radius-pill)] bg-green-900 px-2.5 py-1 text-[11px] font-bold text-white">
              Bio &amp; labels
            </span>
          )}
          {p.nouveau && (
            <span className="rounded-[var(--radius-pill)] bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white">
              Nouveau
            </span>
          )}
          {!p.dispo && (
            <span className="rounded-[var(--radius-pill)] bg-[hsl(45_30%_98%_/_0.92)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
              Carnet complet
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onFav}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={fav}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[hsl(45_30%_98%_/_0.92)] shadow-[var(--shadow-s)] hover:bg-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={fav ? "var(--rose-600)" : "none"}
            stroke={fav ? "var(--rose-600)" : "var(--green-900)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="font-display text-[var(--text-heading-s)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
            {p.nom}
          </div>
          <div className="mt-1 text-[12px] text-[var(--text-muted)]">
            {p.cat} · {p.ville}
          </div>
        </div>

        {p.prod && (
          <p className="text-[14px] leading-normal text-[var(--text-secondary)]">{p.prod}</p>
        )}

        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span
                key={t}
                className="rounded-[var(--radius-s)] bg-[var(--surface-sunken)] px-2 py-1 text-[12px] font-semibold text-[var(--text-secondary)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-[var(--border-subtle)] pt-3">
          <div className="min-w-0">
            <div className="truncate text-[12px] text-[var(--text-muted)]">{p.livraison}</div>
            <div className="mt-0.5 text-[13px] font-bold text-green-900">
              {p.produits > 0
                ? `${p.produits} produit${p.produits > 1 ? "s" : ""}${p.mini ? ` · dès ${p.mini}` : ""}`
                : "Catalogue à venir"}
            </div>
          </div>
          <Button href={`/producteurs/${p.slug}`} variant="outline" size="sm">
            Voir
          </Button>
        </div>
      </div>
    </div>
  );
}
