"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { saveProducerPage } from "@/lib/actions/ma-page";
import { cn } from "@/lib/cn";

type Audience = { pro: boolean; pub: boolean };
type Origine = "plateforme" | "hors";
type ContactLine = { label: string; value: string; pro: boolean; pub: boolean };
type ProduitRow = {
  id: string;
  nom: string;
  detail: string;
  formats: string;
  prix: string;
  description: string;
  photoUrl: string;
};
type MarketRow = { nom: string; jour: string; lieu: string };
type ResellerRow = { nom: string; type: string; ville: string; origine: Origine };
type AmapRow = { nom: string; detail: string; origine: Origine };
type ClientRow = { nom: string; role: string; produit: string };
type CertifRow = { nom: string; annee: string; perso: boolean; lien: string };
type InventoryRow = { poste: string; quantite: string; precision: string };
type NetworkRow = {
  nom: string;
  role: string;
  groupe: "partenaire" | "recommande";
  mot: string;
};
type Btob = { visible: boolean; newRequests: boolean; manualConfirm: boolean };

type Initial = {
  farmName: string;
  productionType: string;
  tagline: string;
  region: string;
  city: string;
  histoire: string;
  valeurs: string[];
  contacts: ContactLine[];
  mapAddress: string;
  responseDelay: string;
  directMarkets: MarketRow[];
  farmShopHours: string;
  farmShopVisit: string;
  farmShopAddress: string;
  resellers: ResellerRow[];
  amaps: AmapRow[];
  otherResellersMention: boolean;
  clients: ClientRow[];
  certifs: CertifRow[];
  legalForm: string;
  siret: string;
  headcount: string;
  capacity: string;
  capacityUnit: string;
  farmArea: string;
  productionMode: string;
  onSiteProcessing: string;
  seasonality: string;
  takeover: string;
  foundedYear: string;
  inventory: InventoryRow[];
  network: NetworkRow[];
  btob: Partial<Btob>;
  minOrderValue: string;
  freeShipping: string;
  leadTime: string;
  deliveryRadius: string;
  deliveryDays: string;
  orderCutoffTime: string;
  coverUrl: string;
  logoUrl: string;
  mediaUrls: string[];
  produits: ProduitRow[];
  visibility: Record<string, Audience>;
};

const emptyMarket = (): MarketRow => ({ nom: "", jour: "", lieu: "" });
const emptyReseller = (): ResellerRow => ({ nom: "", type: "", ville: "", origine: "hors" });
const emptyAmap = (): AmapRow => ({ nom: "", detail: "", origine: "hors" });
const emptyClient = (): ClientRow => ({ nom: "", role: "", produit: "" });
const emptyInventory = (): InventoryRow => ({ poste: "", quantite: "", precision: "" });
const emptyNetwork = (): NetworkRow => ({ nom: "", role: "", groupe: "partenaire", mot: "" });

const NETWORK_GROUPES = [
  { value: "partenaire", label: "Je travaille avec eux" },
  { value: "recommande", label: "Je recommande leur produit" },
];
const LEAD_TIMES = [
  { value: "24", label: "24 h" },
  { value: "48", label: "48 h" },
  { value: "72", label: "72 h" },
  { value: "120", label: "5 jours ouvrés" },
  { value: "168", label: "1 semaine" },
];
const BTOB_ROWS: { key: keyof Btob; titre: string; aide: string }[] = [
  {
    key: "visible",
    titre: "Visible par les revendeurs",
    aide: "Votre page pro apparaît dans le catalogue et les recherches des comptes revendeurs et restaurants.",
  },
  {
    key: "newRequests",
    titre: "Accepter les demandes de nouveaux revendeurs",
    aide: "Un revendeur qui ne vous connaît pas encore peut demander l'accès à votre catalogue.",
  },
  {
    key: "manualConfirm",
    titre: "Je confirme chaque commande à la main",
    aide: "Aucune commande n'est préparée sans votre validation. Décochez pour accepter automatiquement.",
  },
];

const LEGAL_FORMS = [
  { value: "EI", label: "Exploitation individuelle" },
  { value: "EARL", label: "EARL" },
  { value: "GAEC", label: "GAEC" },
  { value: "SCEA", label: "SCEA" },
  { value: "SARL", label: "SARL" },
  { value: "SAS", label: "SAS" },
  { value: "SCOP", label: "SCOP" },
  { value: "ASSO", label: "Association" },
];
const PRODUCTION_MODES = [
  { value: "bio", label: "Bio certifié" },
  { value: "conversion", label: "En conversion bio" },
  { value: "raisonnee", label: "Agriculture raisonnée" },
  { value: "biodynamie", label: "Biodynamie" },
  { value: "conventionnel", label: "Conventionnel" },
];
const SEASONALITIES = [
  { value: "annee", label: "Toute l'année" },
  { value: "saison", label: "Saisonnière" },
  { value: "creux", label: "Toute l'année, avec un creux hivernal" },
];
const INVENTORY_POSTES = [
  "Vaches laitières",
  "Vaches allaitantes",
  "Brebis",
  "Chèvres",
  "Poules pondeuses",
  "Ruches",
  "Hectares de maraîchage",
  "Hectares de céréales",
  "Hectares de vergers",
  "Hectares de vignes",
  "Hectares de houblon",
  "Serres",
  "Cuves de fermentation",
  "Autre",
];

/** Labels agricoles reconnus proposés dans la liste déroulante. */
const CERTIFS_DISPO = [
  "Agriculture Biologique (AB)",
  "Nature & Progrès",
  "Haute Valeur Environnementale (HVE)",
  "AOP / AOC",
  "IGP",
  "Label Rouge",
  "Demeter (biodynamie)",
  "Bleu-Blanc-Cœur",
  "Fair for Life",
];

/** Les 6 lignes de contact, dans l'ordre. Valeurs par défaut : vides. */
const CONTACT_LABELS: { label: string; placeholder: string; pro: boolean; pub: boolean }[] = [
  { label: "Téléphone fixe", placeholder: "03 00 00 00 00", pro: true, pub: true },
  { label: "Portable", placeholder: "06 00 00 00 00", pro: true, pub: false },
  { label: "E-mail", placeholder: "contact@…", pro: true, pub: true },
  { label: "Site internet", placeholder: "www…", pro: true, pub: true },
  { label: "Instagram", placeholder: "@…", pro: false, pub: true },
  { label: "Facebook", placeholder: "facebook.com/…", pro: false, pub: true },
];

const RESPONSE_DELAYS = [
  { value: "24", label: "Sous 24 h" },
  { value: "48", label: "Sous 48 h en semaine" },
  { value: "72", label: "Sous 72 h" },
  { value: "hebdo", label: "Une fois par semaine" },
];


const VALEURS_DISPO = [
  "Circuit court",
  "Zéro déchet",
  "Transparence des prix",
  "Agriculture raisonnée",
  "Bio",
  "Transmission du savoir-faire",
  "Bien-être animal",
  "Énergie renouvelable",
  "Semences paysannes",
  "Biodiversité",
];

/** Deux interrupteurs : Revendeurs (vert) / Particuliers (rose). */
function AudienceToggles({
  value,
  onChange,
  locked = false,
}: {
  value: Audience;
  onChange?: (next: Audience) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex gap-[18px]">
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange?.({ ...value, pro: !value.pro })}
        className={cn("mp-sw", value.pro && "on-pro", locked && "locked")}
      >
        <span className="track">
          <span className="knob" />
        </span>
        Revendeurs
      </button>
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange?.({ ...value, pub: !value.pub })}
        className={cn("mp-sw", value.pub && "on-pub", locked && "locked")}
      >
        <span className="track">
          <span className="knob" />
        </span>
        Particuliers
      </button>
    </div>
  );
}

function Card({
  title,
  help,
  toggles,
  children,
}: {
  title: string;
  help: React.ReactNode;
  toggles: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mp-card">
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="font-display text-[18px] text-[var(--text-primary)]">{title}</div>
          <div className="mt-[5px] max-w-[520px] text-[13px] leading-normal text-[var(--text-muted)]">
            {help}
          </div>
        </div>
        {toggles}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={className}>
      <span className="mp-lab">{label}</span>
      <input className="mp-in" {...props} />
    </label>
  );
}

function SelectField({
  label,
  className,
  options,
  placeholder = "Choisir",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className={className}>
      <span className="mp-lab">{label}</span>
      <select className="mp-in" {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Champ numérique avec suffixe d'unité (style .mp-num de la maquette). */
function NumField({
  label,
  unit,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; unit: string }) {
  return (
    <label className={className}>
      <span className="mp-lab">{label}</span>
      <span className="flex items-center overflow-hidden rounded-[var(--radius-s)] shadow-[inset_0_0_0_1px_var(--border-default)]">
        <input
          className="w-full border-none bg-transparent px-3 py-[11px] text-[14px] outline-none"
          inputMode="decimal"
          {...props}
        />
        <span className="flex items-center self-stretch border-l border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 text-[13px] font-bold text-[var(--text-muted)]">
          {unit}
        </span>
      </span>
    </label>
  );
}

export function MaPageForm({ initial, slug }: { initial: Initial; slug: string }) {
  const [fields, setFields] = useState({
    farmName: initial.farmName,
    productionType: initial.productionType,
    tagline: initial.tagline,
    region: initial.region,
    city: initial.city,
    histoire: initial.histoire,
    mapAddress: initial.mapAddress,
    responseDelay: initial.responseDelay,
    farmShopHours: initial.farmShopHours,
    farmShopVisit: initial.farmShopVisit,
    farmShopAddress: initial.farmShopAddress,
    legalForm: initial.legalForm,
    siret: initial.siret,
    headcount: initial.headcount,
    capacity: initial.capacity,
    capacityUnit: initial.capacityUnit,
    farmArea: initial.farmArea,
    productionMode: initial.productionMode,
    onSiteProcessing: initial.onSiteProcessing,
    seasonality: initial.seasonality,
    takeover: initial.takeover,
    foundedYear: initial.foundedYear,
    minOrderValue: initial.minOrderValue,
    freeShipping: initial.freeShipping,
    leadTime: initial.leadTime,
    deliveryRadius: initial.deliveryRadius,
    deliveryDays: initial.deliveryDays,
    orderCutoffTime: initial.orderCutoffTime,
  });
  const [valeurs, setValeurs] = useState<string[]>(initial.valeurs);
  const [valeurChoix, setValeurChoix] = useState("");
  const [valeurLibre, setValeurLibre] = useState("");
  const [libreOuverte, setLibreOuverte] = useState(false);

  // Contacts : 6 lignes fixes, on hydrate depuis l'existant sinon valeurs par défaut.
  const [contacts, setContacts] = useState<ContactLine[]>(() =>
    CONTACT_LABELS.map((c) => {
      const saved = initial.contacts.find((x) => x.label === c.label);
      return {
        label: c.label,
        value: saved?.value ?? "",
        pro: saved?.pro ?? c.pro,
        pub: saved?.pub ?? c.pub,
      };
    }),
  );

  const [produits, setProduits] = useState<ProduitRow[]>(initial.produits);
  const [markets, setMarkets] = useState<MarketRow[]>(initial.directMarkets);
  const [resellers, setResellers] = useState<ResellerRow[]>(initial.resellers);
  const [amaps, setAmaps] = useState<AmapRow[]>(initial.amaps);
  const [otherResellers, setOtherResellers] = useState(initial.otherResellersMention);
  const [clients, setClients] = useState<ClientRow[]>(initial.clients);
  const [certifs, setCertifs] = useState<CertifRow[]>(initial.certifs);
  const [inventory, setInventory] = useState<InventoryRow[]>(initial.inventory);
  const [network, setNetwork] = useState<NetworkRow[]>(initial.network);
  const [btob, setBtob] = useState<Btob>({
    visible: initial.btob.visible ?? true,
    newRequests: initial.btob.newRequests ?? true,
    manualConfirm: initial.btob.manualConfirm ?? true,
  });
  const [certifChoix, setCertifChoix] = useState("");
  const [certifLibre, setCertifLibre] = useState("");
  const [certifLibreOuverte, setCertifLibreOuverte] = useState(false);

  const defVis = (k: string, d: Audience): Audience => initial.visibility[k] ?? d;
  const [vis, setVis] = useState<Record<string, Audience>>({
    histoire: defVis("histoire", { pro: true, pub: true }),
    valeurs: defVis("valeurs", { pro: true, pub: true }),
    contact: defVis("contact", { pro: true, pub: true }),
    produits: defVis("produits", { pro: true, pub: true }),
    direct: defVis("direct", { pro: false, pub: true }),
    ouTrouver: defVis("ouTrouver", { pro: false, pub: true }),
    clients: defVis("clients", { pro: true, pub: true }),
    certifications: defVis("certifications", { pro: true, pub: true }),
    infos: defVis("infos", { pro: true, pub: false }),
    medias: defVis("medias", { pro: true, pub: true }),
    reseau: defVis("reseau", { pro: true, pub: true }),
  });

  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [isSaving, startSaving] = useTransition();

  const set = (k: keyof typeof fields, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    setStatus("idle");
  };
  const setVisibility = (k: string, next: Audience) => {
    setVis((v) => ({ ...v, [k]: next }));
    setStatus("idle");
  };

  const completion = useMemo(() => {
    const checks = [
      fields.farmName,
      fields.productionType,
      fields.tagline,
      fields.region,
      fields.city,
      fields.histoire,
      valeurs.length ? "x" : "",
      contacts.some((c) => c.value.trim()) ? "x" : "",
      fields.mapAddress,
      produits.length ? "x" : "",
      markets.some((m) => m.nom.trim()) || fields.farmShopHours ? "x" : "",
      resellers.some((r) => r.nom.trim()) || amaps.some((a) => a.nom.trim()) ? "x" : "",
      clients.some((c) => c.nom.trim()) ? "x" : "",
      certifs.some((c) => c.nom.trim()) ? "x" : "",
      fields.legalForm || fields.siret ? "x" : "",
      network.some((r) => r.nom.trim()) ? "x" : "",
      fields.minOrderValue || fields.deliveryRadius ? "x" : "",
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fields, valeurs, contacts, produits, markets, resellers, amaps, clients, certifs, network]);

  const addValeur = (v: string) => {
    const val = v.trim();
    if (!val || valeurs.includes(val)) return;
    setValeurs((list) => [...list, val]);
    setStatus("idle");
  };
  const removeValeur = (v: string) =>
    setValeurs((list) => list.filter((x) => x !== v));

  const onValeurSelect = (v: string) => {
    setValeurChoix("");
    if (v === "__autre") {
      setLibreOuverte(true);
    } else if (v) {
      addValeur(v);
    }
  };

  const setProduit = (i: number, patch: Partial<ProduitRow>) => {
    setProduits((list) => list.map((p, k) => (k === i ? { ...p, ...patch } : p)));
    setStatus("idle");
  };
  const setContact = (i: number, patch: Partial<ContactLine>) => {
    setContacts((list) => list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
    setStatus("idle");
  };
  /** Mutateur générique pour les listes ajoutables (marchés, revendeurs, AMAP). */
  function rowSetter<T>(setter: React.Dispatch<React.SetStateAction<T[]>>) {
    return {
      update: (i: number, patch: Partial<T>) => {
        setter((list) => list.map((r, k) => (k === i ? { ...r, ...patch } : r)));
        setStatus("idle");
      },
      remove: (i: number) => {
        setter((list) => list.filter((_, k) => k !== i));
        setStatus("idle");
      },
      add: (row: T) => {
        setter((list) => [...list, row]);
        setStatus("idle");
      },
    };
  }
  const marketOps = rowSetter(setMarkets);
  const resellerOps = rowSetter(setResellers);
  const amapOps = rowSetter(setAmaps);
  const clientOps = rowSetter(setClients);
  const certifOps = rowSetter(setCertifs);
  const inventoryOps = rowSetter(setInventory);
  const networkOps = rowSetter(setNetwork);
  const toggleBtob = (k: keyof Btob) => {
    setBtob((b) => ({ ...b, [k]: !b[k] }));
    setStatus("idle");
  };

  const addCertif = (nom: string, perso = false) => {
    const n = nom.trim();
    if (!n || certifs.some((c) => c.nom.toLowerCase() === n.toLowerCase())) return;
    certifOps.add({ nom: n, annee: "", perso, lien: "" });
  };
  const onCertifSelect = (v: string) => {
    setCertifChoix("");
    if (v === "__autre") setCertifLibreOuverte(true);
    else if (v) addCertif(v);
  };

  const save = () => {
    setErrorMsg(undefined);
    startSaving(async () => {
      const result = await saveProducerPage({
        farmName: fields.farmName,
        productionType: fields.productionType,
        tagline: fields.tagline,
        region: fields.region,
        city: fields.city,
        histoire: fields.histoire,
        valeurs,
        contacts,
        mapAddress: fields.mapAddress,
        responseDelay: fields.responseDelay,
        directMarkets: markets.filter((m) => m.nom.trim() || m.jour.trim() || m.lieu.trim()),
        farmShopHours: fields.farmShopHours,
        farmShopVisit: fields.farmShopVisit,
        farmShopAddress: fields.farmShopAddress,
        resellers: resellers.filter((r) => r.nom.trim()),
        amaps: amaps.filter((a) => a.nom.trim()),
        otherResellersMention: otherResellers,
        clients: clients.filter((c) => c.nom.trim()),
        certifs: certifs.filter((c) => c.nom.trim()),
        legalForm: fields.legalForm,
        siret: fields.siret,
        headcount: fields.headcount,
        capacity: fields.capacity,
        capacityUnit: fields.capacityUnit,
        farmArea: fields.farmArea,
        productionMode: fields.productionMode,
        onSiteProcessing: fields.onSiteProcessing,
        seasonality: fields.seasonality,
        takeover: fields.takeover,
        foundedYear: fields.foundedYear,
        inventory: inventory.filter((r) => r.poste.trim() || r.quantite.trim()),
        network: network.filter((r) => r.nom.trim()),
        btobVisible: btob.visible,
        btobNewRequests: btob.newRequests,
        btobManualConfirm: btob.manualConfirm,
        minOrderValue: fields.minOrderValue,
        freeShipping: fields.freeShipping,
        leadTime: fields.leadTime,
        deliveryRadius: fields.deliveryRadius,
        deliveryDays: fields.deliveryDays,
        orderCutoffTime: fields.orderCutoffTime,
        produits: produits
          .filter((p) => p.nom.trim())
          .map((p) => ({ ...p, nom: p.nom.trim() })),
        visibility: vis,
      });
      if ("error" in result) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        // On récupère les ids frais pour ne pas recréer les produits au prochain save.
        setProduits(result.produits);
        setStatus("saved");
      }
    });
  };

  const valeursCount = valeurs.length;
  const countColor =
    valeursCount > 5 ? "var(--rose-600)" : valeursCount === 5 ? "var(--amber-600)" : "var(--text-muted)";

  return (
    <>
      <div className="px-6 pb-[140px] pt-8 sm:px-10">
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="mb-2 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
                Ma page
              </div>
              <h1 className="font-display text-[30px] text-[var(--text-primary)]">
                Paramètres de ma page
              </h1>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                href={`/producteurs/${slug}?apercu=pub`}
                variant="outline"
                size="sm"
                target="_blank"
              >
                Aperçu page publique
              </Button>
              <Button
                href={`/producteurs/${slug}?apercu=pro`}
                variant="outline"
                size="sm"
                target="_blank"
              >
                Aperçu page pro
              </Button>
            </div>
          </div>

          {/* Encart « deux pages, une fiche » */}
          <div className="mb-4 grid items-center gap-7 rounded-[var(--radius-l)] bg-[var(--surface-inverse)] px-[30px] py-[26px] lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="font-display text-[20px] leading-snug text-white">
                Vous avez deux pages, une seule fiche à remplir.
              </div>
              <p className="mt-2.5 max-w-[660px] text-[14px] leading-[var(--leading-relaxed)] text-[hsl(45_30%_96%_/_0.85)]">
                Une <strong className="text-white">page publique</strong>, visible par tout le monde
                — les particuliers qui cherchent où acheter chez vous. Et une{" "}
                <strong className="text-white">page pro</strong>, visible seulement par les revendeurs
                et restaurants connectés. Vous remplissez une fois : pour chaque rubrique, vous
                décidez ensuite qui la voit.
              </p>
              <div className="mt-[18px] flex flex-wrap gap-[18px] text-[13px] text-[hsl(45_30%_96%_/_0.9)]">
                <span className="flex items-center gap-2.5">
                  <span className="h-[9px] w-[9px] rounded-full bg-green-500" />
                  Visible par les revendeurs &amp; restaurants
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="h-[9px] w-[9px] rounded-full bg-rose-600" />
                  Visible par les particuliers
                </span>
              </div>
            </div>
            <div className="min-w-[190px] rounded-[var(--radius-m)] bg-[hsl(45_30%_96%_/_0.1)] px-6 py-5">
              <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[hsl(45_30%_96%_/_0.7)]">
                Fiche remplie
              </div>
              <div className="mt-1.5 font-display text-[32px] text-white">{completion}%</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[hsl(45_30%_96%_/_0.18)]">
                <div
                  className="h-full bg-rose-600 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="mt-2.5 text-[12px] text-[hsl(45_30%_96%_/_0.7)]">
                Plus c&apos;est complet, plus les clients vous font confiance.
              </div>
            </div>
          </div>

          {/* Bandeau d'aide */}
          <div className="mb-8 flex items-center gap-3 rounded-[var(--radius-m)] bg-[var(--rose-100)] px-[18px] py-3.5 text-[13px] text-[var(--text-secondary)]">
            Deux interrupteurs en haut de chaque rubrique : à gauche les revendeurs, à droite les
            particuliers. Les deux éteints = personne ne voit la rubrique.
          </div>

          <div className="flex flex-col gap-5">
            {/* ---- Identité ---- */}
            <Card
              title="Identité"
              help="Le nom, l'accroche et les photos. Toujours visible sur les deux pages — c'est votre carte de visite."
              toggles={
                <AudienceToggles value={{ pro: true, pub: true }} locked />
              }
            >
              <div className="grid gap-4 gap-x-5 sm:grid-cols-2">
                <Field
                  label="Nom du domaine / de l'entreprise"
                  value={fields.farmName}
                  onChange={(e) => set("farmName", e.target.value)}
                  placeholder="La Brasserie Sagesse"
                />
                <Field
                  label="Type de production"
                  value={fields.productionType}
                  onChange={(e) => set("productionType", e.target.value)}
                  placeholder="Brasserie & houblonnière"
                />
                <Field
                  label="Accroche (une phrase, la vôtre)"
                  className="sm:col-span-2"
                  value={fields.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="Bières de garde artisanales et houblon cultivé sur place."
                />
                <Field
                  label="Région"
                  value={fields.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Hauts-de-France"
                />
                <Field
                  label="Ville"
                  value={fields.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Arras"
                />
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_180px]">
                <ImageUpload
                  kind="cover"
                  initialUrl={initial.coverUrl || null}
                  label="Photo de couverture"
                  hint="Paysage, JPG/PNG/WebP, 6 Mo max."
                />
                <ImageUpload
                  kind="logo"
                  shape="circle"
                  initialUrl={initial.logoUrl || null}
                  label="Logo"
                  hint="Carré."
                />
              </div>
            </Card>

            {/* ---- Mon histoire ---- */}
            <Card
              title="Mon histoire"
              help="Comment vous travaillez, et pourquoi. Écrivez comme vous parlez : c'est ce que les gens lisent en premier."
              toggles={
                <AudienceToggles
                  value={vis.histoire}
                  onChange={(n) => setVisibility("histoire", n)}
                />
              }
            >
              <textarea
                className="mp-in"
                rows={5}
                value={fields.histoire}
                onChange={(e) => set("histoire", e.target.value)}
                placeholder="Trois cuves, une seule obsession : le temps long. Depuis 2014, on brasse ici…"
              />
              <div className="mt-2 text-[12px] text-[var(--text-muted)]">
                Conseil : 600 à 1 200 caractères. Nommez vos produits, vos parcelles, vos voisins.
              </div>
            </Card>

            {/* ---- Valeurs ---- */}
            <Card
              title="Valeurs"
              help={
                <>
                  Choisissez dans la liste, ou ajoutez les vôtres. On conseille de{" "}
                  <strong>s&apos;en tenir à 5 maximum</strong> : au-delà, plus rien ne vous distingue.
                </>
              }
              toggles={
                <AudienceToggles
                  value={vis.valeurs}
                  onChange={(n) => setVisibility("valeurs", n)}
                />
              }
            >
              <div className="mb-[18px] flex flex-wrap gap-2.5">
                {valeurs.length === 0 && (
                  <span className="text-[13px] text-[var(--text-muted)]">
                    Aucune valeur pour l&apos;instant.
                  </span>
                )}
                {valeurs.map((v) => (
                  <span key={v} className="mp-chip">
                    {v}
                    <button type="button" onClick={() => removeValeur(v)} aria-label={`Retirer ${v}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="grid max-w-[640px] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label>
                  <span className="mp-lab">Ajouter une valeur</span>
                  <select
                    className="mp-in"
                    value={valeurChoix}
                    onChange={(e) => onValeurSelect(e.target.value)}
                  >
                    <option value="">Choisir dans la liste…</option>
                    {VALEURS_DISPO.filter((v) => !valeurs.includes(v)).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value="__autre">+ Autre (saisir la mienne)</option>
                  </select>
                </label>
                <div
                  className="whitespace-nowrap pb-3 font-display text-[13px]"
                  style={{ color: countColor }}
                >
                  {valeursCount} / 5 conseillé
                </div>
              </div>
              {libreOuverte && (
                <div className="mt-3.5 flex max-w-[640px] items-end gap-2.5">
                  <label className="flex-1">
                    <span className="mp-lab">Votre valeur, en deux ou trois mots</span>
                    <input
                      className="mp-in"
                      value={valeurLibre}
                      onChange={(e) => setValeurLibre(e.target.value)}
                      placeholder="ex. Semences paysannes"
                    />
                  </label>
                  <button
                    type="button"
                    className="mp-add"
                    onClick={() => {
                      addValeur(valeurLibre);
                      setValeurLibre("");
                      setLibreOuverte(false);
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              )}
              {valeursCount > 5 && (
                <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius-s)] bg-[var(--rose-100)] px-3.5 py-3 text-[13px] text-green-900">
                  Six valeurs ou plus, ça commence à ressembler à une liste de courses. Gardez les cinq
                  qui vous ressemblent vraiment.
                </div>
              )}
            </Card>

            {/* ---- Contact ---- */}
            <Card
              title="Contact"
              help="Ligne par ligne, vous choisissez qui le voit. Beaucoup de producteurs gardent le portable pour les pros seulement."
              toggles={
                <AudienceToggles value={vis.contact} onChange={(n) => setVisibility("contact", n)} />
              }
            >
              <div className="flex flex-col gap-2.5">
                {contacts.map((c, i) => (
                  <div
                    key={c.label}
                    className="grid items-center gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[150px_minmax(0,1fr)_auto]"
                  >
                    <div className="pl-1 text-[13px] font-bold text-[var(--text-secondary)]">
                      {c.label}
                    </div>
                    <input
                      className="mp-in"
                      value={c.value}
                      placeholder={CONTACT_LABELS[i].placeholder}
                      onChange={(e) => setContact(i, { value: e.target.value })}
                    />
                    <AudienceToggles
                      value={{ pro: c.pro, pub: c.pub }}
                      onChange={(n) => setContact(i, { pro: n.pro, pub: n.pub })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-[18px] grid gap-3.5 gap-x-5 sm:grid-cols-2">
                <Field
                  label="Adresse affichée sur la carte"
                  value={fields.mapAddress}
                  onChange={(e) => set("mapAddress", e.target.value)}
                  placeholder="12 rue du Houblon, 62000 Arras"
                />
                <label>
                  <span className="mp-lab">Délai de réponse annoncé</span>
                  <select
                    className="mp-in"
                    value={fields.responseDelay}
                    onChange={(e) => set("responseDelay", e.target.value)}
                  >
                    <option value="">Non précisé</option>
                    {RESPONSE_DELAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </Card>

            {/* ---- Aperçu des produits ---- */}
            <Card
              title="Aperçu des produits"
              help="La présentation de vos références : photo, détail, formats, description. Pour ajouter, ranger par catégorie ou supprimer un produit, allez dans « Mes produits »."
              toggles={
                <AudienceToggles value={vis.produits} onChange={(n) => setVisibility("produits", n)} />
              }
            >
              {produits.length === 0 && (
                <p className="mb-3.5 text-[13px] text-[var(--text-muted)]">
                  Aucun produit pour l&apos;instant. Ajoutez vos produits dans{" "}
                  <Link href="/compte/produits" className="font-semibold text-[var(--text-brand)] hover:underline">
                    Mes produits
                  </Link>
                  , ils apparaîtront ici pour la mise en forme.
                </p>
              )}
              <div className="mb-3.5 flex flex-col gap-2.5">
                {produits.map((p, i) => (
                  <div
                    key={p.id || `new-${i}`}
                    className="grid items-start gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[56px_minmax(0,1fr)]"
                  >
                    {p.id ? (
                      <div className="w-14">
                        <ImageUpload
                          kind="product"
                          aspect="square"
                          compact
                          productId={p.id}
                          initialUrl={p.photoUrl || null}
                          onChange={(url) => setProduit(i, { photoUrl: url ?? "" })}
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-s)] bg-sand-200 px-1 text-center text-[10px] leading-tight text-[var(--text-muted)]">
                        Photo après enreg.
                      </div>
                    )}
                    <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_130px_120px]">
                      <input
                        className="mp-in"
                        value={p.nom}
                        placeholder="Nom du produit"
                        onChange={(e) => setProduit(i, { nom: e.target.value })}
                      />
                      <input
                        className="mp-in"
                        value={p.detail}
                        placeholder="Détail (origine, durée, %)"
                        onChange={(e) => setProduit(i, { detail: e.target.value })}
                      />
                      <input
                        className="mp-in"
                        value={p.formats}
                        placeholder="Formats"
                        onChange={(e) => setProduit(i, { formats: e.target.value })}
                      />
                      <div className="flex items-center overflow-hidden rounded-[var(--radius-s)] shadow-[inset_0_0_0_1px_var(--border-default)]">
                        <input
                          className="w-full border-none bg-transparent px-3 py-[11px] text-[14px] outline-none"
                          inputMode="decimal"
                          value={p.prix}
                          placeholder="Prix pro"
                          onChange={(e) => setProduit(i, { prix: e.target.value })}
                        />
                        <span className="flex items-center self-stretch border-l border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 text-[13px] font-bold text-[var(--text-muted)]">
                          € HT
                        </span>
                      </div>
                      <input
                        className="mp-in lg:col-span-full"
                        value={p.description}
                        placeholder="Courte description — une ou deux phrases, celles que vous diriez sur le marché"
                        onChange={(e) => setProduit(i, { description: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {produits.length > 0 && (
                <p className="text-[12px] text-[var(--text-muted)]">
                  Ajouter, ranger par catégorie ou supprimer un produit se fait dans{" "}
                  <Link href="/compte/produits" className="font-semibold text-[var(--text-brand)] hover:underline">
                    Mes produits
                  </Link>
                  .
                </p>
              )}
            </Card>

            {/* ---- Acheter mes produits en direct ---- */}
            <Card
              title="Acheter mes produits en direct"
              help="Les marchés où vous êtes présent, et la vente à la ferme. Rubrique surtout utile aux particuliers."
              toggles={
                <AudienceToggles value={vis.direct} onChange={(n) => setVisibility("direct", n)} />
              }
            >
              <div className="mp-lab mb-2.5">Marchés</div>
              <div className="mb-3.5 flex flex-col gap-2.5">
                {markets.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">Aucun marché pour l&apos;instant.</p>
                )}
                {markets.map((m, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_34px]"
                  >
                    <input
                      className="mp-in"
                      value={m.nom}
                      placeholder="Nom du marché"
                      onChange={(e) => marketOps.update(i, { nom: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={m.jour}
                      placeholder="Jour et horaires"
                      onChange={(e) => marketOps.update(i, { jour: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={m.lieu}
                      placeholder="Ville, emplacement"
                      onChange={(e) => marketOps.update(i, { lieu: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer ce marché"
                      onClick={() => marketOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="mp-add" onClick={() => marketOps.add(emptyMarket())}>
                + Ajouter un marché
              </button>

              <div className="my-[22px] h-px bg-[var(--border-subtle)]" />

              <div className="mp-lab mb-2.5">Vente à la ferme</div>
              <div className="grid gap-3.5 gap-x-5 sm:grid-cols-2">
                <Field
                  label="Jours et horaires d'ouverture"
                  value={fields.farmShopHours}
                  onChange={(e) => set("farmShopHours", e.target.value)}
                  placeholder="Mardi au samedi, 10h – 18h"
                />
                <Field
                  label="Visite ou dégustation"
                  value={fields.farmShopVisit}
                  onChange={(e) => set("farmShopVisit", e.target.value)}
                  placeholder="Samedi 11h, sur réservation"
                />
                <Field
                  label="Adresse du point de vente"
                  className="sm:col-span-2"
                  value={fields.farmShopAddress}
                  onChange={(e) => set("farmShopAddress", e.target.value)}
                  placeholder="12 rue du Houblon, 62000 Arras"
                />
              </div>
            </Card>

            {/* ---- Où trouver mes produits ---- */}
            <Card
              title="Où trouver mes produits"
              help="Les enseignes et AMAP qui revendent vos produits. Ajoutez un partenaire hors plateforme, ou (bientôt) piochez dans les comptes déjà inscrits."
              toggles={
                <AudienceToggles
                  value={vis.ouTrouver}
                  onChange={(n) => setVisibility("ouTrouver", n)}
                />
              }
            >
              <div className="mp-lab mb-2.5">Revendeurs</div>
              <div className="mb-3.5 flex flex-col gap-2.5">
                {resellers.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">
                    Aucun revendeur pour l&apos;instant.
                  </p>
                )}
                {resellers.map((r, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_120px_34px]"
                  >
                    <input
                      className="mp-in"
                      value={r.nom}
                      placeholder="Nom de l'enseigne"
                      onChange={(e) => resellerOps.update(i, { nom: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={r.type}
                      placeholder="Type (caviste, épicerie…)"
                      onChange={(e) => resellerOps.update(i, { type: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={r.ville}
                      placeholder="Ville"
                      onChange={(e) => resellerOps.update(i, { ville: e.target.value })}
                    />
                    <span
                      className="text-center font-mono text-[10px] font-bold uppercase tracking-[var(--tracking-wide)]"
                      style={{
                        color:
                          r.origine === "plateforme" ? "var(--green-700)" : "var(--text-muted)",
                      }}
                    >
                      {r.origine === "plateforme" ? "Sur MP" : "Hors plateforme"}
                    </span>
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer ce revendeur"
                      onClick={() => resellerOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mp-add"
                onClick={() => resellerOps.add(emptyReseller())}
              >
                + Ajouter un revendeur
              </button>

              <div className="mt-3 flex items-center justify-between gap-5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
                <div>
                  <div className="text-[14px] font-bold">Mention « et d&apos;autres revendeurs »</div>
                  <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                    Ajoute une ligne finale sur votre page publique, pour les enseignes que vous ne
                    citez pas nommément.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtherResellers((v) => !v);
                    setStatus("idle");
                  }}
                  className={cn("mp-sw", otherResellers && "on-pub")}
                >
                  <span className="track">
                    <span className="knob" />
                  </span>
                  {otherResellers ? "Affichée" : "Masquée"}
                </button>
              </div>

              <div className="my-[22px] h-px bg-[var(--border-subtle)]" />

              <div className="mp-lab mb-2.5">AMAP partenaires</div>
              <div className="mb-3.5 flex flex-col gap-2.5">
                {amaps.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">Aucune AMAP pour l&apos;instant.</p>
                )}
                {amaps.map((a, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_120px_34px]"
                  >
                    <input
                      className="mp-in"
                      value={a.nom}
                      placeholder="Nom de l'AMAP"
                      onChange={(e) => amapOps.update(i, { nom: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={a.detail}
                      placeholder="Ville et jour de distribution"
                      onChange={(e) => amapOps.update(i, { detail: e.target.value })}
                    />
                    <span
                      className="text-center font-mono text-[10px] font-bold uppercase tracking-[var(--tracking-wide)]"
                      style={{
                        color:
                          a.origine === "plateforme" ? "var(--green-700)" : "var(--text-muted)",
                      }}
                    >
                      {a.origine === "plateforme" ? "Sur MP" : "Hors plateforme"}
                    </span>
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer cette AMAP"
                      onClick={() => amapOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="mp-add" onClick={() => amapOps.add(emptyAmap())}>
                + Ajouter une AMAP
              </button>
            </Card>

            {/* ---- Ils utilisent mes produits ---- */}
            <Card
              title="Ils utilisent mes produits"
              help="Restaurants, cantines, bars : vos principaux clients. Demandez-leur avant de les citer."
              toggles={
                <AudienceToggles value={vis.clients} onChange={(n) => setVisibility("clients", n)} />
              }
            >
              <div className="mb-3.5 flex flex-col gap-2.5">
                {clients.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">Aucun client cité pour l&apos;instant.</p>
                )}
                {clients.map((c, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_34px]"
                  >
                    <input
                      className="mp-in"
                      value={c.nom}
                      placeholder="Nom de l'établissement"
                      onChange={(e) => clientOps.update(i, { nom: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={c.role}
                      placeholder="Type, ville"
                      onChange={(e) => clientOps.update(i, { role: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={c.produit}
                      placeholder="Ce qu'il propose de chez vous"
                      onChange={(e) => clientOps.update(i, { produit: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer ce client"
                      onClick={() => clientOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="mp-add" onClick={() => clientOps.add(emptyClient())}>
                + Ajouter un client
              </button>
            </Card>

            {/* ---- Certifications & labels ---- */}
            <Card
              title="Certifications & labels"
              help="Choisissez dans la liste des labels agricoles reconnus, ou ajoutez le vôtre s'il manque. Indiquez l'année d'obtention."
              toggles={
                <AudienceToggles
                  value={vis.certifications}
                  onChange={(n) => setVisibility("certifications", n)}
                />
              }
            >
              <div className="mb-4 flex flex-col gap-2.5">
                {certifs.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">
                    Aucune certification pour l&apos;instant.
                  </p>
                )}
                {certifs.map((c, i) => (
                  <div
                    key={i}
                    className="grid items-start gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1fr)_34px]"
                  >
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_130px_220px]">
                        <div className="pl-1 text-[14px] font-semibold text-[var(--text-primary)]">
                          {c.nom}
                        </div>
                        <input
                          className="mp-in"
                          inputMode="numeric"
                          value={c.annee}
                          placeholder="Année *"
                          onChange={(e) => certifOps.update(i, { annee: e.target.value })}
                        />
                        <button type="button" className="mp-add" disabled>
                          Ajouter le justificatif
                        </button>
                      </div>
                      {c.perso && (
                        <div className="grid gap-3 rounded-[var(--radius-s)] bg-[var(--surface-card)] p-3 shadow-[inset_0_0_0_1px_var(--border-subtle)] md:grid-cols-[200px_minmax(0,1fr)]">
                          <div>
                            <span className="mp-lab">Logo du label</span>
                            <button type="button" className="mp-add" disabled>
                              Ajouter le logo
                            </button>
                          </div>
                          <label>
                            <span className="mp-lab">Lien vers le site du label</span>
                            <input
                              className="mp-in"
                              value={c.lien}
                              placeholder="https://…"
                              onChange={(e) => certifOps.update(i, { lien: e.target.value })}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer cette certification"
                      onClick={() => certifOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="max-w-[560px]">
                <label>
                  <span className="mp-lab">Ajouter une certification</span>
                  <select
                    className="mp-in"
                    value={certifChoix}
                    onChange={(e) => onCertifSelect(e.target.value)}
                  >
                    <option value="">Choisir dans la liste…</option>
                    {CERTIFS_DISPO.filter(
                      (x) => !certifs.some((c) => c.nom === x),
                    ).map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                    <option value="__autre">+ Autre (saisir la mienne)</option>
                  </select>
                </label>
              </div>
              {certifLibreOuverte && (
                <div className="mt-3.5 flex max-w-[640px] items-end gap-2.5">
                  <label className="flex-1">
                    <span className="mp-lab">Nom exact de la certification</span>
                    <input
                      className="mp-in"
                      value={certifLibre}
                      placeholder="ex. Charte Terroir des Flandres"
                      onChange={(e) => setCertifLibre(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="mp-add"
                    onClick={() => {
                      addCertif(certifLibre, true);
                      setCertifLibre("");
                      setCertifLibreOuverte(false);
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius-s)] bg-[var(--surface-sunken)] px-3.5 py-3 text-[13px] text-[var(--text-secondary)]">
                Les justificatifs (attestation, logo) et la vérification arriveront bientôt. Pour
                l&apos;instant, indiquez au moins le nom et l&apos;année.
              </div>
            </Card>

            {/* ---- Informations sur l'exploitation ---- */}
            <Card
              title="Informations sur l'exploitation"
              help="Forme juridique, effectif, capacité. Utile aux revendeurs, plus rarement aux particuliers."
              toggles={
                <AudienceToggles value={vis.infos} onChange={(n) => setVisibility("infos", n)} />
              }
            >
              <div className="grid gap-3.5 gap-x-5 sm:grid-cols-2">
                <SelectField
                  label="Forme juridique"
                  options={LEGAL_FORMS}
                  value={fields.legalForm}
                  onChange={(e) => set("legalForm", e.target.value)}
                />
                <Field
                  label="Année de création"
                  inputMode="numeric"
                  value={fields.foundedYear}
                  onChange={(e) => set("foundedYear", e.target.value)}
                  placeholder="2014"
                />
                <NumField
                  label="Effectif"
                  unit="personnes"
                  value={fields.headcount}
                  onChange={(e) => set("headcount", e.target.value)}
                  placeholder="6"
                />
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2.5">
                  <NumField
                    label="Capacité de production"
                    unit={fields.capacityUnit || "/ an"}
                    value={fields.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                    placeholder="800"
                  />
                  <Field
                    label="Unité"
                    value={fields.capacityUnit}
                    onChange={(e) => set("capacityUnit", e.target.value)}
                    placeholder="hL / an"
                  />
                </div>
                <NumField
                  label="Surface totale (SAU)"
                  unit="ha"
                  value={fields.farmArea}
                  onChange={(e) => set("farmArea", e.target.value)}
                  placeholder="4"
                />
                <Field
                  label="SIRET"
                  value={fields.siret}
                  onChange={(e) => set("siret", e.target.value)}
                  placeholder="812 456 993 00021"
                />
                <SelectField
                  label="Mode de production"
                  options={PRODUCTION_MODES}
                  value={fields.productionMode}
                  onChange={(e) => set("productionMode", e.target.value)}
                />
                <NumField
                  label="Part transformée sur place"
                  unit="%"
                  value={fields.onSiteProcessing}
                  onChange={(e) => set("onSiteProcessing", e.target.value)}
                  placeholder="100"
                />
                <SelectField
                  label="Saisonnalité de l'activité"
                  options={SEASONALITIES}
                  value={fields.seasonality}
                  onChange={(e) => set("seasonality", e.target.value)}
                />
                <Field
                  label="Reprise / installation"
                  value={fields.takeover}
                  onChange={(e) => set("takeover", e.target.value)}
                  placeholder="Installation hors cadre familial, 2014"
                />
              </div>

              <div className="mt-6 mp-lab">Cheptel, cultures &amp; équipement</div>
              <p className="mb-3 text-[12px] text-[var(--text-muted)]">
                Combien de vaches, de serres, de ruches, de cuves… Ce sont ces chiffres que les
                revendeurs regardent pour juger si vous pouvez tenir un volume.
              </p>
              <div className="mb-3.5 flex flex-col gap-2.5">
                {inventory.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">Aucune ligne pour l&apos;instant.</p>
                )}
                {inventory.map((it, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1.2fr)_34px]"
                  >
                    <select
                      className="mp-in"
                      value={it.poste}
                      onChange={(e) => inventoryOps.update(i, { poste: e.target.value })}
                    >
                      <option value="">Choisir…</option>
                      {INVENTORY_POSTES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      className="mp-in"
                      inputMode="decimal"
                      value={it.quantite}
                      placeholder="Quantité"
                      onChange={(e) => inventoryOps.update(i, { quantite: e.target.value })}
                    />
                    <input
                      className="mp-in"
                      value={it.precision}
                      placeholder="Précision (race, variété, modèle…)"
                      onChange={(e) => inventoryOps.update(i, { precision: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mp-x"
                      aria-label="Retirer cette ligne"
                      onClick={() => inventoryOps.remove(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mp-add"
                onClick={() => inventoryOps.add(emptyInventory())}
              >
                + Ajouter une ligne
              </button>
            </Card>

            {/* ---- Photos & vidéos ---- */}
            <Card
              title="Photos & vidéos"
              help="Cinq médias maximum. Des mains, des outils, une matière — pas de produit sur fond blanc."
              toggles={
                <AudienceToggles value={vis.medias} onChange={(n) => setVisibility("medias", n)} />
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <ImageUpload
                    key={i}
                    kind="media"
                    aspect="square"
                    compact
                    slot={i}
                    initialUrl={initial.mediaUrls[i] || null}
                  />
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[var(--text-muted)]">
                Photos uniquement pour l&apos;instant (la vidéo viendra plus tard). JPG/PNG/WebP, 6 Mo
                max.
              </p>
            </Card>

            {/* ---- Mon réseau ---- */}
            <Card
              title="Mon réseau"
              help="Les producteurs avec qui vous travaillez et ceux dont vous recommandez le produit."
              toggles={
                <AudienceToggles value={vis.reseau} onChange={(n) => setVisibility("reseau", n)} />
              }
            >
              <div className="mb-3.5 flex flex-col gap-2.5">
                {network.length === 0 && (
                  <p className="text-[13px] text-[var(--text-muted)]">Aucun producteur pour l&apos;instant.</p>
                )}
                {network.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3"
                  >
                    <div className="grid items-center gap-2.5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_210px_34px]">
                      <input
                        className="mp-in"
                        value={r.nom}
                        placeholder="Nom du producteur"
                        onChange={(e) => networkOps.update(i, { nom: e.target.value })}
                      />
                      <input
                        className="mp-in"
                        value={r.role}
                        placeholder="Production, ville"
                        onChange={(e) => networkOps.update(i, { role: e.target.value })}
                      />
                      <select
                        className="mp-in"
                        value={r.groupe}
                        onChange={(e) =>
                          networkOps.update(i, {
                            groupe: e.target.value as NetworkRow["groupe"],
                          })
                        }
                      >
                        {NETWORK_GROUPES.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="mp-x"
                        aria-label="Retirer ce producteur"
                        onClick={() => networkOps.remove(i)}
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      className="mp-in"
                      rows={2}
                      value={r.mot}
                      maxLength={400}
                      placeholder="Un mot sur ce producteur, avec vos propres mots : ce que vous faites ensemble, pourquoi vous le recommandez…"
                      onChange={(e) => networkOps.update(i, { mot: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <button type="button" className="mp-add" onClick={() => networkOps.add(emptyNetwork())}>
                + Ajouter un producteur
              </button>
            </Card>

            {/* ---- Mon activité BtoB ---- */}
            <section className="rounded-[var(--radius-l)] bg-[var(--surface-inverse)] px-7 py-6 shadow-[var(--shadow-m)]">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="font-display text-[18px] text-white">Mon activité BtoB</div>
                  <div className="mt-[5px] max-w-[520px] text-[13px] leading-normal text-[hsl(45_30%_96%_/_0.7)]">
                    Trois réglages qui décident si des revendeurs peuvent vous solliciter, et comment.
                  </div>
                </div>
                <span className="mp-sw on-pro locked" style={{ color: "hsl(45 30% 96% / 0.7)" }}>
                  <span className="track">
                    <span className="knob" />
                  </span>
                  Revendeurs uniquement
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {BTOB_ROWS.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-5 rounded-[var(--radius-m)] bg-[hsl(45_30%_96%_/_0.08)] px-[18px] py-4"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-white">{row.titre}</div>
                      <div className="mt-1 text-[12px] leading-normal text-[hsl(45_30%_96%_/_0.7)]">
                        {row.aide}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBtob(row.key)}
                      className={cn("mp-sw", btob[row.key] && "on-pub")}
                      style={{ color: "hsl(45 30% 96% / 0.85)" }}
                    >
                      <span className="track">
                        <span className="knob" />
                      </span>
                      {btob[row.key] ? "Activé" : "Coupé"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ---- Commande & logistique pro ---- */}
            <section className="mp-card">
              <div className="mb-[18px] flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="font-display text-[18px] text-[var(--text-primary)]">
                    Commande &amp; logistique pro
                  </div>
                  <div className="mt-[5px] max-w-[520px] text-[13px] leading-normal text-[var(--text-muted)]">
                    Jamais visible sur la page publique. Ces réglages alimentent les tournées
                    mutualisées et le calcul du franco côté revendeur.
                  </div>
                </div>
                <span className="mp-sw on-pro locked">
                  <span className="track">
                    <span className="knob" />
                  </span>
                  Revendeurs uniquement
                </span>
              </div>
              <div className="grid gap-3.5 gap-x-5 sm:grid-cols-2">
                <NumField
                  label="Minimum de commande"
                  unit="€ HT"
                  value={fields.minOrderValue}
                  onChange={(e) => set("minOrderValue", e.target.value)}
                  placeholder="120"
                />
                <NumField
                  label="Livraison offerte à partir de (franco)"
                  unit="€ HT"
                  value={fields.freeShipping}
                  onChange={(e) => set("freeShipping", e.target.value)}
                  placeholder="250"
                />
                <NumField
                  label="Rayon de livraison"
                  unit="km"
                  value={fields.deliveryRadius}
                  onChange={(e) => set("deliveryRadius", e.target.value)}
                  placeholder="100"
                />
                <SelectField
                  label="Délai de préparation"
                  options={LEAD_TIMES}
                  value={fields.leadTime}
                  onChange={(e) => set("leadTime", e.target.value)}
                />
                <Field
                  label="Jour(s) de tournée"
                  value={fields.deliveryDays}
                  onChange={(e) => set("deliveryDays", e.target.value)}
                  placeholder="Mardi, Vendredi"
                />
                <Field
                  label="Heure limite de commande"
                  value={fields.orderCutoffTime}
                  onChange={(e) => set("orderCutoffTime", e.target.value)}
                  placeholder="18h la veille"
                />
              </div>
            </section>

            <p className="px-1 text-[13px] text-[var(--text-muted)]">
              Toutes les rubriques de « Ma page » sont en place. Le téléversement des photos, logos et
              justificatifs viendra dans une étape dédiée.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Barre d'enregistrement ---- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border-subtle)] bg-[hsl(45_30%_98%_/_0.92)] backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-6 py-3.5 sm:px-10">
          <div className="text-[13px] text-[var(--text-muted)]">
            {status === "saved" && (
              <span className="font-semibold text-[var(--state-success)]">
                ✓ Modifications enregistrées
              </span>
            )}
            {status === "error" && (
              <span className="font-semibold text-[var(--state-danger)]">{errorMsg}</span>
            )}
            {status === "idle" && "Vos changements ne sont pas encore enregistrés."}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/compte" className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline">
              Retour au compte
            </Link>
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
