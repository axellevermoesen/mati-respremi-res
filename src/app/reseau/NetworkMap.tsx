"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type * as LeafletTypes from "leaflet";
import { cn } from "@/lib/cn";

export type NProd = {
  id: string;
  slug: string;
  nom: string;
  cat: string;
  ville: string;
  lat: number;
  lng: number;
  bio: boolean;
  depuis: number | null;
  prod: string;
};
export type NLink = {
  from: string;
  to: string;
  type: "DELIVERY_PARTNER" | "RECOMMENDATION";
  note: string;
};
export type NTour = { id: string; date: string; region: string; stops: string[] };

type LinkType = NLink["type"];

const LTYPES: Record<LinkType, { label: string; color: string; dash: boolean; w: number; desc: string }> = {
  DELIVERY_PARTNER: {
    label: "Tournée mutualisée",
    color: "#CB748E",
    dash: true,
    w: 2.6,
    desc: "Même camion, même jour, plusieurs producteurs.",
  },
  RECOMMENDATION: {
    label: "Recommandation",
    color: "#426E55",
    dash: false,
    w: 2,
    desc: "« Chez lui, c'est du sérieux » — un producteur en présente un autre.",
  },
};

function initials(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function frDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

/** Points d'une courbe de Bézier douce entre a et b. */
function curve(a: [number, number], b: [number, number], bend: number): [number, number][] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * cx + t * t * b[0],
      u * u * a[1] + 2 * u * t * cy + t * t * b[1],
    ]);
  }
  return pts;
}

export function NetworkMap({
  producers,
  links,
  tours,
}: {
  producers: NProd[];
  links: NLink[];
  tours: NTour[];
}) {
  const byId = useMemo(() => Object.fromEntries(producers.map((p) => [p.id, p])), [producers]);
  const cats = useMemo(
    () => [...new Set(producers.map((p) => p.cat))].sort((a, b) => a.localeCompare(b, "fr")),
    [producers],
  );
  const tourOf = useMemo(() => {
    const m: Record<string, NTour> = {};
    tours.forEach((t) => t.stops.forEach((s) => (m[s] = t)));
    return m;
  }, [tours]);
  const neighborsOf = useMemo(
    () => (id: string) =>
      links
        .filter((l) => l.from === id || l.to === id)
        .map((l) => ({ other: l.from === id ? l.to : l.from, type: l.type, note: l.note })),
    [links],
  );

  const [catFilter, setCatFilter] = useState<string[]>([]);
  const [bioOnly, setBioOnly] = useState(false);
  const [tourOnly, setTourOnly] = useState(false);
  const [linkTypes, setLinkTypes] = useState<Set<LinkType>>(
    () => new Set<LinkType>(["DELIVERY_PARTNER", "RECOMMENDATION"]),
  );
  const [showTours, setShowTours] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const LRef = useRef<typeof LeafletTypes | null>(null);
  const layers = useRef<{
    tours?: LeafletTypes.LayerGroup;
    links?: LeafletTypes.LayerGroup;
    pins?: LeafletTypes.LayerGroup;
  }>({});
  const boundsRef = useRef<LeafletTypes.LatLngBounds | null>(null);

  const visible = useMemo(
    () => (p: NProd) => {
      if (catFilter.length && !catFilter.includes(p.cat)) return false;
      if (bioOnly && !p.bio) return false;
      if (tourOnly && !tourOf[p.id]) return false;
      return true;
    },
    [catFilter, bioOnly, tourOnly, tourOf],
  );

  // --- init de la carte (une fois) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current, { zoomControl: false, minZoom: 5, maxZoom: 13, zoomSnap: 0.25 });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      layers.current.tours = L.layerGroup().addTo(map);
      layers.current.links = L.layerGroup().addTo(map);
      layers.current.pins = L.layerGroup().addTo(map);
      mapRef.current = map;
      if (producers.length) {
        const b = L.latLngBounds(producers.map((p) => [p.lat, p.lng] as [number, number])).pad(0.12);
        boundsRef.current = b;
        map.fitBounds(b);
      } else {
        map.setView([50, 2.6], 7);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- (re)dessin ---
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    const gT = layers.current.tours!;
    const gL = layers.current.links!;
    const gP = layers.current.pins!;
    gT.clearLayers();
    gL.clearLayers();
    gP.clearLayers();

    const vis = new Set(producers.filter(visible).map((p) => p.id));
    const nb = sel ? new Set(neighborsOf(sel).map((n) => n.other)) : null;

    if (showTours) {
      tours.forEach((t) => {
        const focus = !sel || t.stops.includes(sel);
        const pts = t.stops
          .map((s) => byId[s])
          .filter(Boolean)
          .map((p) => [p.lat, p.lng] as [number, number]);
        if (pts.length < 2) return;
        L.polyline(pts, {
          color: "#CB748E",
          weight: focus ? 3 : 1.8,
          opacity: focus ? 0.9 : 0.18,
          dashArray: "7 7",
          lineJoin: "round",
          lineCap: "round",
          interactive: false,
        }).addTo(gT);
      });
    }

    links.forEach((l, i) => {
      if (!linkTypes.has(l.type)) return;
      if (!vis.has(l.from) || !vis.has(l.to)) return;
      const isSel = sel && (l.from === sel || l.to === sel);
      if (sel && !isSel) return;
      const a = byId[l.from];
      const b = byId[l.to];
      if (!a || !b) return;
      const t = LTYPES[l.type];
      L.polyline(curve([a.lat, a.lng], [b.lat, b.lng], i % 2 ? 0.12 : -0.12), {
        color: t.color,
        weight: isSel ? t.w + 1.2 : t.w,
        opacity: sel ? 0.95 : 0.4,
        dashArray: t.dash ? "2 7" : undefined,
        lineCap: "round",
        interactive: false,
      }).addTo(gL);
    });

    producers.forEach((p) => {
      const shown = vis.has(p.id) || (sel && (p.id === sel || nb!.has(p.id)));
      if (!shown) return;
      let cls = "";
      if (sel) cls = p.id === sel ? "is-sel" : nb!.has(p.id) ? "is-nb" : "is-dim";
      const m = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          html: `<div class="rez-pin ${cls}"><div class="rez-dot">${initials(p.nom)}</div><div class="rez-lab">${p.nom}</div></div>`,
        }),
        riseOnHover: true,
        zIndexOffset: p.id === sel ? 900 : sel && nb!.has(p.id) ? 500 : 100,
      }).on("click", (e) => {
        L.DomEvent.stop(e);
        setSel((cur) => (cur === p.id ? null : p.id));
      });
      gP.addLayer(m);
    });
  }, [
    ready,
    sel,
    catFilter,
    bioOnly,
    tourOnly,
    linkTypes,
    showTours,
    producers,
    links,
    tours,
    byId,
    visible,
    neighborsOf,
  ]);

  // --- recentrage sur sélection ---
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    if (sel && byId[sel]) {
      const p = byId[sel];
      const pts: [number, number][] = [
        [p.lat, p.lng],
        ...neighborsOf(sel)
          .map((n) => byId[n.other])
          .filter(Boolean)
          .map((x) => [x.lat, x.lng] as [number, number]),
      ];
      map.flyToBounds(L.latLngBounds(pts).pad(0.4), { duration: 0.6, maxZoom: 10 });
    } else if (boundsRef.current) {
      map.flyToBounds(boundsRef.current, { duration: 0.6 });
    }
  }, [sel, ready, byId, neighborsOf]);

  const toggleCat = (c: string) =>
    setCatFilter((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleLinkType = (t: LinkType) =>
    setLinkTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  const reset = () => {
    setCatFilter([]);
    setBioOnly(false);
    setTourOnly(false);
    setLinkTypes(new Set<LinkType>(["DELIVERY_PARTNER", "RECOMMENDATION"]));
    setSel(null);
  };

  const shownList = producers.filter(visible).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const selProd = sel ? byId[sel] : null;

  return (
    <div
      className="flex min-h-[540px] flex-col lg:grid lg:h-[calc(100vh-73px)] lg:overflow-hidden"
      style={{
        gridTemplateColumns: "clamp(232px,24vw,300px) minmax(320px,1fr) clamp(320px,30vw,390px)",
      }}
    >
      {/* ── Filtres + liste ── */}
      <aside className="flex min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-page)]">
        <div className="border-b border-[var(--border-subtle)] p-5">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
            Carte du réseau
          </div>
          <h1 className="mt-2 font-display text-[24px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
            Qui travaille avec qui
          </h1>
          <p className="mt-2.5 text-[13px] leading-normal text-[var(--text-secondary)]">
            Cliquez sur un producteur : vous voyez ses partenaires, ce qu&apos;ils s&apos;échangent
            et la tournée qu&apos;ils partagent.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5">
          <section>
            <Eyebrow>Filière</Eyebrow>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Chip key={c} on={catFilter.includes(c)} onClick={() => toggleCat(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <Eyebrow>Affiner</Eyebrow>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Chip on={bioOnly} onClick={() => setBioOnly((v) => !v)}>
                Bio &amp; labels
              </Chip>
              <Chip on={tourOnly} onClick={() => setTourOnly((v) => !v)}>
                Sur une tournée
              </Chip>
            </div>
          </section>

          <section>
            <Eyebrow>Nature des liens</Eyebrow>
            <div className="mt-2.5 flex flex-col gap-0.5">
              {(Object.keys(LTYPES) as LinkType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleLinkType(k)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-s)] px-2 py-1.5 text-left transition-opacity hover:bg-[var(--surface-sunken)]",
                    !linkTypes.has(k) && "opacity-40",
                  )}
                >
                  <span
                    className="inline-block w-5 shrink-0"
                    style={
                      LTYPES[k].dash
                        ? { borderTop: `2px dashed ${LTYPES[k].color}` }
                        : { height: 2.5, background: LTYPES[k].color }
                    }
                  />
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                    {LTYPES[k].label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <Eyebrow>Producteurs</Eyebrow>
              <span className="font-display text-[12px] text-[var(--text-muted)]">
                {shownList.length} / {producers.length}
              </span>
            </div>
            <div className="mt-2.5 flex flex-col gap-0.5">
              {shownList.map((p) => {
                const n = neighborsOf(p.id).length;
                const on = sel === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSel((cur) => (cur === p.id ? null : p.id))}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-m)] px-2.5 py-2 text-left",
                      on ? "bg-green-900" : "hover:bg-[var(--surface-sunken)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full font-display text-[10px] text-white",
                        on ? "bg-rose-600" : "bg-green-700",
                      )}
                    >
                      {initials(p.nom)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[14px] font-bold leading-tight",
                          on ? "text-white" : "text-[var(--text-primary)]",
                        )}
                      >
                        {p.nom}
                      </span>
                      <span
                        className={cn(
                          "block text-[12px]",
                          on ? "text-[hsl(45_30%_96%_/_0.7)]" : "text-[var(--text-muted)]",
                        )}
                      >
                        {p.ville} · {n} lien{n > 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </aside>

      {/* ── Carte ── */}
      <main className="relative h-[58vh] min-h-[380px] lg:h-auto">
        <div ref={mapEl} className="absolute inset-0 bg-[var(--sand-100)]" />
        <div className="absolute left-4 top-4 z-[500] flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTours((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-m)] px-4 py-2.5 text-[13px] font-semibold shadow-[var(--shadow-m)]",
              showTours
                ? "bg-rose-600 text-white"
                : "bg-[hsl(45_30%_98%_/_0.94)] text-green-900 shadow-[inset_0_0_0_1.5px_var(--green-900),var(--shadow-s)]",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                showTours ? "bg-white" : "bg-[var(--sand-400)]",
              )}
            />
            Tournées mutualisées
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-[var(--radius-m)] bg-[hsl(45_30%_98%_/_0.94)] px-4 py-2.5 text-[13px] font-semibold text-green-900 shadow-[inset_0_0_0_1.5px_var(--green-900),var(--shadow-s)]"
          >
            Vue d&apos;ensemble
          </button>
        </div>

        <div className="absolute bottom-7 left-4 z-[400] hidden max-w-[240px] rounded-[var(--radius-m)] bg-[hsl(45_30%_98%_/_0.94)] p-3.5 shadow-[var(--shadow-m)] sm:block">
          <Eyebrow>Légende</Eyebrow>
          <div className="mt-2 flex flex-col gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full border-2 border-white bg-green-700 shadow-[var(--shadow-s)]" />
              Producteur
            </span>
            <span className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full border-2 border-white bg-rose-600 shadow-[var(--shadow-s)]" />
              Sélectionné
            </span>
            <span className="flex items-center gap-2.5">
              <span className="inline-block w-5" style={{ borderTop: "2px dashed #CB748E" }} />
              Tournée mutualisée
            </span>
            <span className="flex items-center gap-2.5">
              <span className="inline-block h-[2.5px] w-5 bg-green-700" />
              Recommandation
            </span>
          </div>
        </div>
      </main>

      {/* ── Détail ── */}
      <aside className="min-h-0 overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--surface-card)] p-6">
        {selProd ? (
          <SelectedPanel
            p={selProd}
            neighbors={neighborsOf(selProd.id)}
            tour={tourOf[selProd.id] ?? null}
            byId={byId}
            onPick={setSel}
          />
        ) : (
          <OverviewPanel
            producers={producers}
            links={links}
            tours={tours}
            neighborsOf={neighborsOf}
            onPick={setSel}
          />
        )}
      </aside>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
      {children}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-semibold",
        on
          ? "border-green-900 bg-green-900 text-white"
          : "border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--border-default)]",
      )}
    >
      {children}
    </button>
  );
}

function Kpi({ v, l }: { v: string | number; l: string }) {
  return (
    <div className="rounded-[var(--radius-m)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-s)]">
      <div className="font-display text-[22px] leading-none text-green-900">{v}</div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
        {l}
      </div>
    </div>
  );
}

function SelectedPanel({
  p,
  neighbors,
  tour,
  byId,
  onPick,
}: {
  p: NProd;
  neighbors: { other: string; type: LinkType; note: string }[];
  tour: NTour | null;
  byId: Record<string, NProd>;
  onPick: (id: string) => void;
}) {
  const grouped = (Object.keys(LTYPES) as LinkType[])
    .map((k) => ({ k, items: neighbors.filter((n) => n.type === k) }))
    .filter((g) => g.items.length);
  const tourCount = neighbors.filter((n) => n.type === "DELIVERY_PARTNER").length;

  return (
    <div>
      <div className="flex items-start gap-3.5">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-rose-600 font-display text-[15px] text-white">
          {initials(p.nom)}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[21px] leading-[var(--leading-snug)] text-[var(--text-primary)]">
            {p.nom}
          </h2>
          <div className="mt-1 text-[13px] text-[var(--text-muted)]">
            {p.cat} · {p.ville}
            {p.depuis ? ` · depuis ${p.depuis}` : ""}
          </div>
        </div>
      </div>

      {p.prod && (
        <p className="mt-3.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">{p.prod}</p>
      )}

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {p.bio && (
          <span className="rounded-[var(--radius-s)] bg-[var(--rose-100)] px-2 py-1 text-[12px] font-semibold text-green-900">
            Bio &amp; labels
          </span>
        )}
        <span className="rounded-[var(--radius-s)] bg-[var(--surface-sunken)] px-2 py-1 text-[12px] font-semibold text-[var(--text-secondary)]">
          {tour ? "Sur une tournée" : "Livraison directe"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Kpi v={neighbors.length} l="Liens actifs" />
        <Kpi v={tourCount} l="Trajets partagés" />
        <Kpi v={tour ? tour.stops.length : 1} l="Sur le camion" />
      </div>

      {tour && (
        <div className="mt-5 rounded-[var(--radius-l)] bg-[var(--surface-inverse)] p-4">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            Livraison mutualisée
          </div>
          <div className="mt-1.5 font-display text-[16px] capitalize text-white">
            {frDate(tour.date)} · {tour.region}
          </div>
          <div className="mt-2.5 text-[13px] leading-normal text-[hsl(45_30%_96%_/_0.82)]">
            Une tournée, {tour.stops.length} producteur{tour.stops.length > 1 ? "s" : ""} sur le
            même passage.
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
          Travaille avec
        </div>
        {grouped.length === 0 && (
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">
            Pas encore de lien renseigné pour ce producteur.
          </p>
        )}
        {grouped.map((g) => (
          <div key={g.k} className="mt-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-block w-4"
                style={
                  LTYPES[g.k].dash
                    ? { borderTop: `2px dashed ${LTYPES[g.k].color}` }
                    : { height: 2.5, background: LTYPES[g.k].color }
                }
              />
              <span className="text-[12px] font-bold text-[var(--text-secondary)]">
                {LTYPES[g.k].label}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {g.items.map((n) => {
                const o = byId[n.other];
                if (!o) return null;
                return (
                  <button
                    key={n.other}
                    type="button"
                    onClick={() => onPick(o.id)}
                    className="flex items-start gap-3 rounded-[var(--radius-m)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-left transition-shadow hover:shadow-[var(--shadow-m)]"
                  >
                    <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-green-700 font-display text-[10px] text-white">
                      {initials(o.nom)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold leading-tight">{o.nom}</span>
                      <span className="block text-[12px] text-[var(--text-muted)]">
                        {o.cat} · {o.ville}
                      </span>
                      {n.note && (
                        <span className="mt-1.5 block text-[12.5px] leading-normal text-[var(--text-secondary)]">
                          {n.note}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href={`/producteurs/${p.slug}`}
          className="inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-semibold text-white hover:bg-green-900"
        >
          Voir la fiche
        </Link>
      </div>
    </div>
  );
}

function OverviewPanel({
  producers,
  links,
  tours,
  neighborsOf,
  onPick,
}: {
  producers: NProd[];
  links: NLink[];
  tours: NTour[];
  neighborsOf: (id: string) => { other: string; type: LinkType; note: string }[];
  onPick: (id: string) => void;
}) {
  const tourLinks = links.filter((l) => l.type === "DELIVERY_PARTNER").length;
  const bio = producers.filter((p) => p.bio).length;
  const top = [...producers]
    .map((p) => ({ p, n: neighborsOf(p.id).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);

  return (
    <div>
      <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
        Vue d&apos;ensemble
      </div>
      <h2 className="mt-2 font-display text-[21px] leading-[var(--leading-snug)] text-[var(--text-primary)]">
        {producers.length} producteurs, {links.length} liens, {tours.length} tournée
        {tours.length > 1 ? "s" : ""}
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
        Le réseau tel qu&apos;il tourne aujourd&apos;hui. Chaque trait est un accord réel entre deux
        producteurs : une matière première, un surplus valorisé, un camion partagé.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Kpi v={tourLinks} l="Trajets mutualisés" />
        <Kpi v={tours.length} l="Tournées actives" />
        <Kpi v={bio} l="Fermes labellisées" />
        <Kpi v={producers.length} l="Producteurs cartographiés" />
      </div>

      {tours.length > 0 && (
        <div className="mt-6">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
            Les tournées
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {tours.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => t.stops[0] && onPick(t.stops[0])}
                className="rounded-[var(--radius-m)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-left transition-shadow hover:shadow-[var(--shadow-m)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[14px] capitalize text-green-900">
                    {frDate(t.date)}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">{t.region}</span>
                </div>
                <div className="mt-1.5 text-[12.5px] text-[var(--text-secondary)]">
                  {t.stops.length} producteurs sur le même passage
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
          Les plus connectés
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          {top.map(({ p, n }) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="flex items-center gap-3 rounded-[var(--radius-m)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 text-left transition-shadow hover:shadow-[var(--shadow-m)]"
            >
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-green-700 font-display text-[10px] text-white">
                {initials(p.nom)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{p.nom}</span>
                <span className="block text-[12px] text-[var(--text-muted)]">{p.ville}</span>
              </span>
              <span className="font-display text-[16px] text-rose-600">{n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
