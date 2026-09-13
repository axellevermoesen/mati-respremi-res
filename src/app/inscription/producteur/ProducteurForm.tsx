"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { Tag } from "@/components/ui/Tag";
import { Badge } from "@/components/ui/Badge";
import { completeProducerProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/cn";

type FormFields = {
  dirigeantPrenom: string;
  dirigeantNom: string;
  structureNom: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  tagline: string;
  typeProduction: string;
  region: string;
  histoireDebut: string;
  histoireAujourdhui: string;
  commandeMinimum: string;
  anneeCreation: string;
};

const EMPTY_FIELDS: FormFields = {
  dirigeantPrenom: "",
  dirigeantNom: "",
  structureNom: "",
  siret: "",
  adresse: "",
  codePostal: "",
  ville: "",
  tagline: "",
  typeProduction: "",
  region: "",
  histoireDebut: "",
  histoireAujourdhui: "",
  commandeMinimum: "",
  anneeCreation: "",
};


const STEPS = [
  "intro",
  "m-basics",
  "basics",
  "m-questions",
  "identite",
  "histoire",
  "valeurs",
  "livraison",
  "saison",
  "certifs",
  "medias",
  "m-catalogue",
  "catalogue",
  "m-collegues",
  "collegues",
  "m-reco",
  "reco",
  "final",
] as const;

type StepId = (typeof STEPS)[number];

const OPTIONAL: StepId[] = [
  "identite",
  "histoire",
  "valeurs",
  "livraison",
  "saison",
  "certifs",
  "medias",
  "catalogue",
  "collegues",
  "reco",
];

const MESSAGES: Record<
  string,
  { kicker: string; title: string; body: string; note: string; cta: string }
> = {
  intro: {
    kicker: "Bienvenue",
    title: "On va créer ton profil, ensemble.",
    body: "Cela peut prendre 5 minutes ou 1 heure. Matières Premières, c'est un peu un site de rencontre : pour trouver les bons clients, il faut les séduire. Plus ton profil est complet, plus les clients ont envie de travailler avec toi.",
    note: "On va y aller par étapes.",
    cta: "C'est parti",
  },
  "m-basics": {
    kicker: "Étape 1",
    title: "Les basics.",
    body: "Histoire de ne pas se quitter sans avoir un numéro de téléphone, et d'être sûr que tu es sur le bon site.",
    note: "Si tu vends des bijoux : désolé, ce n'est pas ici.",
    cta: "Je remplis",
  },
  "m-questions": {
    kicker: "Étape 2",
    title: "J'ai plein de questions.",
    body: "Elles sont là pour t'aider à compléter ton profil. Tu réponds à celles qui te parlent le plus.",
    note: "Tu peux passer les questions ou les étapes entières et y revenir plus tard.",
    cta: "Allons-y",
  },
  "m-catalogue": {
    kicker: "Étape 3",
    title: "Maintenant, ton catalogue.",
    body: "Ce que tu vends, à quel prix, dans quelle unité. Un seul produit suffit pour commencer.",
    note: "Tu en ajouteras d'autres quand tu veux, depuis ton espace.",
    cta: "Ajouter un produit",
  },
  "m-collegues": {
    kicker: "Étape 4",
    title: "Tes collègues de tournée.",
    body: "Tu as sûrement des collègues avec qui tu travailles. Renseigne-les pour mutualiser les commandes et les livraisons.",
    note: "Une tournée, plusieurs producteurs. La mutualisation, ça a du bon.",
    cta: "Les ajouter",
  },
  "m-reco": {
    kicker: "Étape 5",
    title: "Ceux que tu recommandes.",
    body: "Tu ne travailles pas avec eux, mais tu recommandes leur travail : c'est le moment de le faire savoir.",
    note: "Ils apparaîtront sur ta page et recevront une notification pour te recommander à leur tour — et tu apparaîtras sur la leur.",
    cta: "Je recommande",
  },
};

const SECTIONS: Record<string, string> = {
  intro: "Bienvenue",
  "m-basics": "Les basics",
  basics: "Les basics",
  "m-questions": "Ton profil",
  identite: "Ton profil",
  histoire: "Ton profil",
  valeurs: "Ton profil",
  livraison: "Ton profil",
  saison: "Ton profil",
  certifs: "Ton profil",
  medias: "Ton profil",
  "m-catalogue": "Ton catalogue",
  catalogue: "Ton catalogue",
  "m-collegues": "Ton réseau",
  collegues: "Ton réseau",
  "m-reco": "Ton réseau",
  reco: "Ton réseau",
  final: "Terminé",
};

const ANNUAIRE = [
  { id: "pc", nom: "Ferme du Petit Clos", role: "Maraîchage · Arras", initiales: "PC" },
  { id: "tv", nom: "Fromagerie des Trois Vallées", role: "Lait cru · Béthune", initiales: "TV" },
  { id: "vc", nom: "Verger de la Combe", role: "Arboriculture · Douai", initiales: "VC" },
  { id: "bm", nom: "Brasserie du Marais", role: "Brasserie · Douai", initiales: "BM" },
  { id: "mf", nom: "Moulin de Flandre", role: "Farines · Cassel", initiales: "MF" },
];

const VALEURS = [
  "Circuit court",
  "Zéro déchet",
  "Transparence des prix",
  "Agriculture raisonnée",
  "Bio",
  "Transmission du savoir-faire",
  "Bien-être animal",
  "Énergie renouvelable",
];

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const CERTIFS = [
  { id: "bio", label: "Bio · Ecocert", hint: "Contrôle annuel" },
  { id: "np", label: "Nature & Progrès", hint: "Mention" },
  { id: "hve", label: "Haute Valeur Environnementale", hint: "Niveau 3" },
  { id: "aop", label: "AOP / IGP", hint: "Appellation" },
];

const MODES = [
  { id: "directe", titre: "Livraison directe", detail: "Ton camion, ta tournée, tes horaires." },
  { id: "retrait", titre: "Retrait sur place", detail: "Le client vient chercher sa commande." },
  {
    id: "collecte",
    titre: "Point de collecte mutualisé",
    detail: "On regroupe avec les producteurs voisins.",
  },
];

const TYPES_PRODUCTION = [
  "Maraîchage",
  "Élevage",
  "Fromagerie",
  "Brasserie",
  "Cidrerie",
  "Boulangerie",
  "Arboriculture",
  "Apiculture",
  "Autre",
].map((t) => ({ value: t, label: t }));

const CATEGORIES = ["Boissons", "Fromages", "Viandes", "Légumes", "Fruits", "Épicerie"].map((c) => ({
  value: c,
  label: c,
}));

type Produit = {
  nom: string;
  cat: string;
  prix: string;
  unite: string;
  desc: string;
  statut: "ligne" | "grenier";
};

function ImageSlot({ label, circle }: { label: string; circle?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-[var(--surface-sunken)] p-4 text-center",
        circle ? "rounded-full" : "rounded-[var(--radius-m)]",
      )}
    >
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
      {children}
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="font-display text-[26px] text-[var(--text-primary)]">{title}</h2>
      <p className="mt-2 text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
        {sub}
      </p>
    </div>
  );
}

export function ProducteurForm() {
  const [i, setI] = useState(0);
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [valeurs, setValeurs] = useState<string[]>([]);
  const [mois, setMois] = useState<number[]>([]);
  const [certifs, setCertifs] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>(["directe"]);
  const [collegues, setCollegues] = useState<string[]>([]);
  const [recos, setRecos] = useState<string[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [isSaving, startSaving] = useTransition();

  const set = <K extends keyof FormFields>(key: K, value: string) =>
    setFields((f) => ({ ...f, [key]: value }));
  const [draft, setDraft] = useState<Produit>({
    nom: "",
    cat: "",
    prix: "",
    unite: "",
    desc: "",
    statut: "ligne",
  });

  const id = STEPS[i];
  const msg = MESSAGES[id];
  const isMessage = Boolean(msg);
  const isFinal = id === "final";
  const progress = Math.round((i / (STEPS.length - 1)) * 100);

  const filled = [
    valeurs.length,
    mois.length,
    certifs.length,
    produits.length,
    collegues.length,
    recos.length,
  ].filter((n) => n > 0).length;

  const next = () => setI((v) => Math.min(v + 1, STEPS.length - 1));
  const back = () => setI((v) => Math.max(v - 1, 0));

  const toggle =
    <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (val: T) =>
      setter((list) =>
        list.includes(val) ? list.filter((x) => x !== val) : [...list, val],
      );

  const toggleValeur = toggle(setValeurs);
  const toggleMois = toggle(setMois);
  const toggleCertif = toggle(setCertifs);
  const toggleMode = toggle(setModes);
  const toggleCollegue = toggle(setCollegues);
  const toggleReco = toggle(setRecos);

  const addProduit = () => {
    if (!draft.nom.trim()) return;
    setProduits((p) => [...p, draft]);
    setDraft({ nom: "", cat: "", prix: "", unite: "", desc: "", statut: "ligne" });
  };

  const CERTIF_LABELS = Object.fromEntries(CERTIFS.map((c) => [c.id, c.label]));

  const handleFinish = () => {
    setSaveError(undefined);
    startSaving(async () => {
      const result = await completeProducerProfile({
        ...fields,
        valeurs,
        certifications: certifs.map((id) => CERTIF_LABELS[id] ?? id),
        produits,
      });
      if ("error" in result) {
        setSaveError(result.error);
      } else {
        setI(STEPS.length - 1); // écran "final"
      }
    });
  };

  const ctaLabel = isMessage
    ? msg.cta
    : id === "reco"
      ? isSaving
        ? "Enregistrement…"
        : "Terminer mon profil"
      : "Continuer";

  function PeopleList({
    selected,
    onToggle,
    accent,
  }: {
    selected: string[];
    onToggle: (id: string) => void;
    accent: "green" | "rose";
  }) {
    return (
      <div className="flex flex-col gap-2.5">
        {ANNUAIRE.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-3.5 text-left shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--border-default)]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[13px] transition-colors",
                    on
                      ? accent === "rose"
                        ? "bg-rose-600 text-white"
                        : "bg-green-700 text-white"
                      : "bg-sand-200 text-[var(--text-muted)]",
                  )}
                >
                  {p.initiales}
                </span>
                <div>
                  <div className="text-[15px] font-bold text-[var(--text-primary)]">{p.nom}</div>
                  <div className="mt-0.5 text-[13px] text-[var(--text-muted)]">{p.role}</div>
                </div>
              </div>
              <Checkbox checked={on} readOnly tabIndex={-1} />
            </button>
          );
        })}
      </div>
    );
  }

  function renderStep() {
    if (isMessage) {
      return (
        <div className="py-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="h-0.5 w-7 bg-rose-600" />
            <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
              {msg.kicker}
            </div>
          </div>
          <div className="font-display text-[34px] leading-[var(--leading-tight)] text-[var(--text-primary)] [text-wrap:pretty]">
            {msg.title}
          </div>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
            {msg.body}
          </p>
          <p className="mt-3.5 max-w-[520px] text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
            {msg.note}
          </p>
        </div>
      );
    }

    switch (id) {
      case "basics":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Les basics"
              sub="Le dirigeant, la structure, l'adresse. Obligatoire, promis c'est la seule."
            />
            <div className="flex flex-col gap-3.5">
              <SectionLabel>Le dirigeant</SectionLabel>
              <div className="grid grid-cols-2 gap-3.5">
                <Input
                  label="Prénom"
                  placeholder="Marius"
                  value={fields.dirigeantPrenom}
                  onChange={(e) => set("dirigeantPrenom", e.target.value)}
                />
                <Input
                  label="Nom"
                  placeholder="Delcourt"
                  value={fields.dirigeantNom}
                  onChange={(e) => set("dirigeantNom", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Input label="Téléphone" type="tel" placeholder="06 12 34 56 78" />
                <Input
                  label="Email professionnel"
                  type="email"
                  placeholder="marius@brasserie-sagesse.fr"
                />
              </div>
            </div>
            <div className="h-px bg-[var(--border-subtle)]" />
            <div className="flex flex-col gap-3.5">
              <SectionLabel>L&apos;exploitation</SectionLabel>
              <Input
                label="Nom de la structure"
                placeholder="La Brasserie Sagesse"
                value={fields.structureNom}
                onChange={(e) => set("structureNom", e.target.value)}
              />
              <Input
                label="N° SIRET"
                placeholder="123 456 789 00012"
                helper="14 chiffres. C'est aussi comme ça qu'on vérifie que tu produis bien de l'alimentaire."
                value={fields.siret}
                onChange={(e) => set("siret", e.target.value)}
              />
              <Input
                label="Adresse"
                placeholder="12 rue du Houblon"
                value={fields.adresse}
                onChange={(e) => set("adresse", e.target.value)}
              />
              <div className="grid grid-cols-[1fr_1.6fr] gap-3.5">
                <Input
                  label="Code postal"
                  placeholder="62000"
                  value={fields.codePostal}
                  onChange={(e) => set("codePostal", e.target.value)}
                />
                <Input
                  label="Ville"
                  placeholder="Arras"
                  value={fields.ville}
                  onChange={(e) => set("ville", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "identite":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="On fait le tour de la ferme ?"
              sub="Une photo de couverture, un logo, une phrase. C'est la première chose qu'un chef verra."
            />
            <div className="h-[220px] overflow-hidden rounded-[var(--radius-l)]">
              <ImageSlot label="Photo de couverture — le lieu, l'équipe, les cuves" />
            </div>
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full">
                <ImageSlot label="Logo" circle />
              </div>
              <div className="flex-1">
                <Input
                  label="La phrase qui te résume"
                  placeholder="Bières de garde et houblon cultivé sur place."
                  helper="Une ligne. Deux si tu es bavard."
                  value={fields.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Select
                label="Type de production"
                placeholder="Choisir"
                options={TYPES_PRODUCTION}
                value={fields.typeProduction}
                onChange={(e) => set("typeProduction", e.target.value)}
              />
              <Input
                label="Région"
                placeholder="Hauts-de-France"
                value={fields.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </div>
          </div>
        );

      case "histoire":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Raconte ton histoire"
              sub="Pas un communiqué de presse. Ce que tu dirais à un chef qui pousse la porte de la ferme."
            />
            <Textarea
              label="Comment tout a commencé"
              rows={5}
              placeholder="Trois cuves, une seule obsession : le temps long…"
              value={fields.histoireDebut}
              onChange={(e) => set("histoireDebut", e.target.value)}
            />
            <Textarea
              label="Ta façon de travailler aujourd'hui"
              rows={4}
              placeholder="Six personnes, huit références, un rayon de 100 km…"
              value={fields.histoireAujourdhui}
              onChange={(e) => set("histoireAujourdhui", e.target.value)}
            />
          </div>
        );

      case "valeurs":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Ce qui compte pour toi"
              sub="Choisis ce qui est vrai chez toi. Trois honnêtes valent mieux que dix décoratives."
            />
            <div className="flex flex-wrap gap-2.5">
              {VALEURS.map((v) => (
                <Tag key={v} selected={valeurs.includes(v)} onClick={() => toggleValeur(v)}>
                  {v}
                </Tag>
              ))}
            </div>
            <Input
              label="Une valeur qui n'est pas dans la liste"
              placeholder="Transmission du savoir-faire"
            />
          </div>
        );

      case "livraison":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Comment tu livres ?"
              sub="C'est ce qui décide si un restaurant peut travailler avec toi. On ne rigole plus."
            />
            <div className="flex flex-col gap-2.5">
              {MODES.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-4 shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                >
                  <div>
                    <div className="text-[15px] font-bold text-[var(--text-primary)]">{m.titre}</div>
                    <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{m.detail}</div>
                  </div>
                  <Switch
                    checked={modes.includes(m.id)}
                    onChange={() => toggleMode(m.id)}
                    label={m.titre}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Input label="Rayon de livraison" placeholder="100 km" />
              <Input
                label="Commande minimum"
                placeholder="80 €"
                value={fields.commandeMinimum}
                onChange={(e) => set("commandeMinimum", e.target.value)}
              />
            </div>
          </div>
        );

      case "saison":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Ta saison"
              sub="Clique les mois où tu produis. Les chefs construisent leurs cartes avec ça."
            />
            <div className="grid grid-cols-12 gap-1.5">
              {MOIS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleMois(idx)}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={cn(
                      "h-11 w-full rounded-[var(--radius-s)] transition-colors",
                      mois.includes(idx) ? "bg-rose-600" : "bg-sand-200",
                    )}
                  />
                  <div className="font-display text-[10px] text-[var(--text-muted)]">{label}</div>
                </button>
              ))}
            </div>
            <Input
              label="Un mot sur ta saison"
              placeholder="Récolte du houblon en septembre — le reste de l'année, on brasse quand même."
            />
          </div>
        );

      case "certifs":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Labels et papiers officiels"
              sub="Si tu en as. Sinon, passe — ça ne t'empêchera pas de vendre."
            />
            <div className="flex flex-col gap-2.5">
              {CERTIFS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCertif(c.id)}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-3.5 text-left shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--border-default)]"
                >
                  <Checkbox label={c.label} checked={certifs.includes(c.id)} readOnly tabIndex={-1} />
                  <span className="font-display text-[12px] text-[var(--text-muted)]">{c.hint}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Input
                label="Année de création"
                placeholder="2014"
                inputMode="numeric"
                value={fields.anneeCreation}
                onChange={(e) => set("anneeCreation", e.target.value)}
              />
              <Input label="Effectif" placeholder="6 personnes" />
            </div>
          </div>
        );

      case "medias":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Montre la ferme"
              sub="Les mains, les outils, la matière. Les photos de produit sur fond blanc, on verra plus tard."
            />
            <div className="grid grid-cols-3 grid-rows-2 gap-2.5 [grid-template-rows:132px_132px]">
              <div className="row-span-2 overflow-hidden rounded-[var(--radius-m)]">
                <ImageSlot label="Vidéo ou photo principale" />
              </div>
              {["Photo", "Photo", "Photo", "Photo"].map((l, k) => (
                <div key={k} className="overflow-hidden rounded-[var(--radius-m)]">
                  <ImageSlot label={l} />
                </div>
              ))}
            </div>
          </div>
        );

      case "catalogue":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Ton catalogue"
              sub="Un produit, un prix, une unité. Commence par celui dont tu es le plus fier."
            />
            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <div className="h-[120px] overflow-hidden rounded-[var(--radius-m)]">
                <ImageSlot label="Photo produit" />
              </div>
              <div className="flex flex-col gap-3.5">
                <Input
                  label="Nom du produit"
                  placeholder="Bière de garde ambrée, 33 cl"
                  value={draft.nom}
                  onChange={(e) => setDraft({ ...draft, nom: e.target.value })}
                />
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
                  <Select
                    label="Catégorie"
                    placeholder="Choisir"
                    options={CATEGORIES}
                    value={draft.cat}
                    onChange={(e) => setDraft({ ...draft, cat: e.target.value })}
                  />
                  <Input
                    label="Prix HT"
                    placeholder="2,40 €"
                    value={draft.prix}
                    onChange={(e) => setDraft({ ...draft, prix: e.target.value })}
                  />
                  <Input
                    label="Unité"
                    placeholder="bouteille"
                    value={draft.unite}
                    onChange={(e) => setDraft({ ...draft, unite: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <Textarea
              label="Description"
              rows={3}
              placeholder="Fermentation longue, houblon de la ferme, amertume ronde. Se garde deux ans."
              value={draft.desc}
              onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
            />
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                Ce produit, on en fait quoi ?
              </span>
              <div className="flex flex-wrap gap-2.5">
                <Tag
                  selected={draft.statut === "ligne"}
                  onClick={() => setDraft({ ...draft, statut: "ligne" })}
                >
                  Mettre en ligne
                </Tag>
                <Tag
                  selected={draft.statut === "grenier"}
                  onClick={() => setDraft({ ...draft, statut: "grenier" })}
                >
                  Garder dans le grenier
                </Tag>
              </div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {draft.statut === "grenier"
                  ? "Il reste dans ton espace, invisible pour les clients. Tu le sortiras quand il sera prêt."
                  : "Visible dans le catalogue dès que ton profil est validé."}
              </div>
            </div>
            <div>
              <Button variant="secondary" size="md" onClick={addProduit}>
                Ajouter au catalogue
              </Button>
            </div>
            <div className="h-px bg-[var(--border-subtle)]" />
            {produits.length > 0 ? (
              <div className="flex flex-col gap-2">
                {produits.map((p, k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="text-[15px] font-bold text-[var(--text-primary)]">
                          {p.nom}
                        </div>
                        <Badge tone={p.statut === "grenier" ? "neutral" : "success"}>
                          {p.statut === "grenier" ? "Au grenier" : "En ligne"}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-[13px] text-[var(--text-muted)]">
                        {[p.cat, p.prix, p.unite && `l'${p.unite}`, p.desc]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProduits((list) => list.filter((_, j) => j !== k))}
                      className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[14px] text-[var(--text-muted)]">
                Ton catalogue est vide. Pour l&apos;instant, personne ne peut rien t&apos;acheter — on
                répare ça ?
              </div>
            )}
          </div>
        );

      case "collegues":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Tes collègues de tournée"
              sub="Ceux avec qui tu travailles déjà. On regroupera vos commandes et vos livraisons."
            />
            <Select
              label="Chercher un producteur déjà inscrit"
              placeholder="Producteurs autour d'Arras"
              options={ANNUAIRE.map((p) => ({ value: p.id, label: p.nom }))}
              onChange={(e) => e.target.value && toggleCollegue(e.target.value)}
            />
            <PeopleList selected={collegues} onToggle={toggleCollegue} accent="green" />
            <div className="h-px bg-[var(--border-subtle)]" />
            <div className="flex flex-col gap-3">
              <div className="text-[14px] text-[var(--text-secondary)]">
                Il en manque ? Ceux qui ne sont pas encore sur Matières Premières.
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Emails de tes collègues"
                    placeholder="pierre@ferme-du-clos.fr, contact@verger-combe.fr"
                  />
                </div>
                <Button size="md">Inviter</Button>
              </div>
            </div>
          </div>
        );

      case "reco":
        return (
          <div className="flex flex-col gap-5">
            <StepHeading
              title="Ceux dont tu recommandes le travail"
              sub="Tu ne travailles pas avec eux, mais tu mettrais ta main à couper pour leurs produits."
            />
            <p className="text-[13px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
              Ils apparaîtront sur ta page et recevront une notification pour te recommander à leur
              tour — et tu apparaîtras sur la leur.
            </p>
            <Select
              label="Chercher un producteur"
              placeholder="Tous les producteurs"
              options={ANNUAIRE.map((p) => ({ value: p.id, label: p.nom }))}
              onChange={(e) => e.target.value && toggleReco(e.target.value)}
            />
            <PeopleList selected={recos} onToggle={toggleReco} accent="rose" />
          </div>
        );

      case "final":
        return (
          <div className="py-4">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="h-0.5 w-7 bg-rose-600" />
              <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
                Profil créé
              </div>
            </div>
            <div className="font-display text-[34px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
              Et voilà, tu es prêt à vendre.
            </div>
            <p className="mt-[18px] max-w-[520px] text-[17px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
              Ton profil part en vérification — 24 h ouvrées, pas plus. Dès qu&apos;il sera validé, tu
              pourras le partager à tes clients.
            </p>
            <div className="mt-7">
              <Button href="/compte" size="lg">
                Voir mon compte
              </Button>
            </div>
            <div className="mt-6 text-[13px] text-[var(--text-muted)]">
              Profil complété à {Math.round((filled / 6) * 100)}% — tu peux l&apos;enrichir quand tu
              veux.
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-8 py-5">
        <Link
          href="/"
          className="font-display text-[18px] tracking-[var(--tracking-tight)] text-green-900"
        >
          Matières Premières
        </Link>
        <span className="text-[13px] font-semibold text-[var(--text-brand)]">
          Enregistrer et reprendre plus tard
        </span>
      </div>

      {/* Corps */}
      <div className="flex flex-1 justify-center px-6 pb-[72px] pt-12">
        <div className="flex w-full max-w-[680px] flex-col">
          {/* Progression */}
          <div className="flex items-center gap-4">
            <div className="h-1 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-sand-200">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-green-700"
                style={{ width: `${progress}%`, transition: `width 360ms cubic-bezier(0,0,.2,1)` }}
              />
            </div>
            <div className="whitespace-nowrap font-display text-[12px] text-[var(--text-muted)]">
              {SECTIONS[id]}
            </div>
          </div>

          {/* Carte */}
          <div className="mt-6 rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)] sm:p-12 sm:px-14">
            {renderStep()}
          </div>

          {/* Navigation */}
          {!isFinal && (
            <div className="mt-6 flex flex-col gap-3">
              {saveError && (
                <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
                  {saveError}
                </p>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={back}
                      className="text-[14px] font-semibold text-[var(--text-brand)] transition-colors hover:text-green-900 hover:underline"
                    >
                      ← Retour
                    </button>
                  )}
                  {OPTIONAL.includes(id) && (
                    <button
                      type="button"
                      onClick={next}
                      className="text-[14px] font-semibold text-rose-600 transition-colors hover:text-[var(--accent-secondary-hover)] hover:underline"
                    >
                      Passer cette étape
                    </button>
                  )}
                </div>
                <Button
                  size="lg"
                  disabled={isSaving}
                  onClick={id === "reco" ? handleFinish : next}
                >
                  {ctaLabel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-8 py-5 text-[12px] text-[var(--text-muted)]">
        <span>© 2026 Matières Premières</span>
        <Link href="/connexion" className="hover:underline">
          J&apos;ai déjà un compte
        </Link>
      </div>
    </div>
  );
}
