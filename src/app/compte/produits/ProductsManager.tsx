"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  renameCategory,
  setPublicCatalogue,
} from "@/lib/actions/products";
import Image from "next/image";
import {
  SIZE_UNITS,
  computedUnitPrice,
  fmtMoney,
  toAmount as amt,
  type SaleFormatInput,
} from "@/lib/formats";

type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  retailPrice: string;
  vatRate: string;
  description: string;
  photoUrl: string;
  isActive: boolean;
  orders: number;
  formats: SaleFormatInput[];
  stockMode: "global" | "format";
  stock: string;
  stockUnit: string;
};

const newFormat = (): SaleFormatInput => ({
  id: Math.random().toString(36).slice(2, 10),
  label: "",
  size: "",
  sizeUnit: "",
  pricePro: "",
  priceRetail: "",
  unitPrice: "",
  stock: "",
});

type PriceMode = "retail" | "pro" | "none";
type Flash = (kind: "ok" | "err", text: string) => void;

const PRICE_MODES: { value: PriceMode; label: string }[] = [
  { value: "retail", label: "Prix conseillés (grand public)" },
  { value: "pro", label: "Prix pro (BtoB)" },
  { value: "none", label: "Aucun prix" },
];

const ALL = "__all__";
const fr = (a: string, b: string) => a.localeCompare(b, "fr");
const vatKey = (v: string) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? String(n) : "5.5";
};

export function ProductsManager({
  slug,
  products,
  publicVisible,
  publicPriceMode,
}: {
  slug: string;
  products: Product[];
  publicVisible: boolean;
  publicPriceMode: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<string>(ALL);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [adding, setAdding] = useState(products.length === 0);
  const [draft, setDraft] = useState({
    name: "",
    category: "",
    unit: "pièce",
    price: "",
    vatRate: "5.5",
  });
  const [pending, start] = useTransition();
  const msgTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash: Flash = (kind, text) => {
    setMsg({ kind, text });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4500);
  };

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(fr),
    [products],
  );

  const effectiveTab = tab !== ALL && !categories.includes(tab) ? ALL : tab;

  const q = filter.trim().toLowerCase();
  const shown = products.filter(
    (p) =>
      (effectiveTab === ALL || p.category === effectiveTab) &&
      (!q || p.name.toLowerCase().includes(q)),
  );

  const groups = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of shown) {
      const list = m.get(p.category) ?? [];
      list.push(p);
      m.set(p.category, list);
    }
    return [...m.entries()].sort((a, b) => fr(a[0], b[0]));
  }, [shown]);

  const activeCount = products.filter((p) => p.isActive).length;

  function handleAdd() {
    if (!draft.name.trim()) {
      flash("err", "Donnez un nom au produit.");
      return;
    }
    const cat = draft.category.trim() || "Autre";
    start(async () => {
      const r = await createProduct(draft);
      if ("error" in r) return flash("err", r.error);
      setDraft({ ...draft, name: "", price: "" });
      setTab(cat);
      flash("ok", "Produit ajouté. Complétez sa photo et sa description ci-dessous.");
      router.refresh();
    });
  }

  function handleRename(cat: string) {
    const to = window.prompt(`Renommer la catégorie « ${cat} » en :`, cat);
    if (to == null || to.trim() === cat || !to.trim()) return;
    start(async () => {
      const r = await renameCategory(cat, to);
      if ("error" in r) return flash("err", r.error);
      setTab(to.trim());
      flash("ok", `Catégorie renommée (${r.count} produit${r.count > 1 ? "s" : ""}).`);
      router.refresh();
    });
  }

  function handleVisibility(next: boolean) {
    start(async () => {
      const r = await setPublicCatalogue({ visible: next });
      if ("error" in r) return flash("err", r.error);
      flash(
        "ok",
        next
          ? "Catalogue visible sur votre page publique."
          : "Catalogue masqué de votre page publique.",
      );
      router.refresh();
    });
  }

  function handlePriceMode(mode: PriceMode) {
    if (mode === publicPriceMode) return;
    start(async () => {
      const r = await setPublicCatalogue({ priceMode: mode });
      if ("error" in r) return flash("err", r.error);
      flash("ok", "Affichage des prix mis à jour.");
      router.refresh();
    });
  }

  const rows = (list: Product[]) =>
    list.map((p) => (
      <ProductRow
        key={`${p.id}:${p.name}:${p.category}:${p.unit}:${vatKey(p.vatRate)}:${p.description}:${p.photoUrl}:${p.isActive}:${p.stockMode}:${p.stock}:${p.stockUnit}:${JSON.stringify(p.formats)}`}
        product={p}
        onMutated={() => router.refresh()}
        flash={flash}
      />
    ));

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-12">
      <datalist id="mp-product-cats">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="mp-size-units">
        {SIZE_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
            Espace producteur
          </div>
          <h1 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
            Mes produits
          </h1>
          <p className="mt-2 max-w-[560px] text-[14px] text-[var(--text-secondary)]">
            Rangez votre catalogue par catégorie. Une vue claire pour préparer vos commandes et
            vos tournées mutualisées, même avec beaucoup de références.
          </p>
        </div>
        <Button type="button" onClick={() => setAdding((v) => !v)}>
          {adding ? "Fermer" : "Ajouter un produit"}
        </Button>
      </div>

      {/* Résumé */}
      <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
        <span className="rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-3 py-1 font-semibold text-[var(--text-secondary)]">
          {products.length} produit{products.length > 1 ? "s" : ""}
        </span>
        <span className="rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-3 py-1 font-semibold text-[var(--text-secondary)]">
          {activeCount} en vente
        </span>
        <span className="rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] px-3 py-1 font-semibold text-[var(--text-secondary)]">
          {categories.length} catégorie{categories.length > 1 ? "s" : ""}
        </span>
      </div>

      {msg && (
        <div
          className={cn(
            "mt-4 rounded-[var(--radius-m)] px-4 py-3 text-[13px] font-semibold text-white",
            msg.kind === "ok" ? "bg-green-700" : "bg-rose-600",
          )}
        >
          {msg.text}
        </div>
      )}

      {/* Visibilité du catalogue sur la page publique */}
      <div className="mt-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14px] font-bold text-[var(--text-primary)]">
            Rendre mon catalogue visible sur la page publique
          </div>
          <button
            type="button"
            onClick={() => handleVisibility(!publicVisible)}
            disabled={pending}
            role="switch"
            aria-checked={publicVisible}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              publicVisible ? "bg-green-700" : "bg-[var(--sand-200)]",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                publicVisible ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[var(--text-muted)]">
          Attention : même catalogue visible, vous choisissez ci-dessous quels prix apparaissent
          sur votre page publique — ou aucun prix du tout.
        </p>

        <div
          className={cn(
            "mt-3 flex flex-wrap gap-2",
            !publicVisible && "pointer-events-none opacity-40",
          )}
        >
          {PRICE_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => handlePriceMode(m.value)}
              disabled={pending || !publicVisible}
              className={cn(
                "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[12px] font-bold",
                publicPriceMode === m.value
                  ? "bg-green-700 text-white"
                  : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)]",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ajouter un produit */}
      {adding && (
        <div className="mt-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]">
          <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Nouveau produit
          </div>
          <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_110px_130px]">
            <input
              className="mp-in"
              placeholder="Nom du produit"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className="mp-in"
              list="mp-product-cats"
              placeholder="Catégorie"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className="mp-in"
              placeholder="Unité"
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            />
            <input
              className="mp-in"
              placeholder="Prix € HT"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <select
              className="mp-in"
              value={vatKey(draft.vatRate)}
              onChange={(e) => setDraft({ ...draft, vatRate: e.target.value })}
            >
              <option value="5.5">TVA 5,5 %</option>
              <option value="10">TVA 10 %</option>
              <option value="20">TVA 20 %</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" onClick={handleAdd} disabled={pending}>
              Ajouter au catalogue
            </Button>
            <span className="text-[12px] text-[var(--text-muted)]">
              La photo et la description se remplissent ensuite, sur la fiche du produit.
            </span>
          </div>
        </div>
      )}

      {/* Onglets par catégorie */}
      {products.length > 0 && (
        <div className="mt-7 flex gap-1.5 overflow-x-auto border-b border-[var(--border-subtle)]">
          <TabButton active={effectiveTab === ALL} onClick={() => setTab(ALL)}>
            Tous <span className="opacity-60">{products.length}</span>
          </TabButton>
          {categories.map((c) => (
            <TabButton key={c} active={effectiveTab === c} onClick={() => setTab(c)}>
              {c} <span className="opacity-60">{products.filter((p) => p.category === c).length}</span>
            </TabButton>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {effectiveTab !== ALL && (
          <button
            type="button"
            onClick={() => handleRename(effectiveTab)}
            className="text-[12px] font-semibold text-[var(--text-brand)] hover:underline"
          >
            Renommer la catégorie « {effectiveTab} »
          </button>
        )}
        {products.length > 4 && (
          <input
            className="mp-in w-full max-w-[360px]"
            placeholder="Filtrer par nom…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        )}
      </div>

      {/* Liste */}
      {products.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-10 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-s)]">
          Votre catalogue est vide. Ajoutez votre premier produit ci-dessus.
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-[14px] text-[var(--text-muted)]">
          Aucun produit {q ? `ne correspond à « ${filter} »` : "dans cette catégorie"}.
        </p>
      ) : effectiveTab === ALL ? (
        <div className="mt-5 flex flex-col gap-7">
          {groups.map(([cat, list]) => (
            <section key={cat}>
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="font-display text-[18px] text-green-900">{cat}</h2>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {list.length} produit{list.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRename(cat)}
                  className="text-[12px] font-semibold text-[var(--text-brand)] hover:underline"
                >
                  Renommer
                </button>
              </div>
              <div className="flex flex-col gap-2.5">{rows(list)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">{rows(shown)}</div>
      )}

      <p className="mt-10 text-[13px] text-[var(--text-muted)]">
        La mise en avant vitrine (formats détaillés, mise en page) se règle dans{" "}
        <Link href="/compte/ma-page" className="font-semibold text-[var(--text-brand)] hover:underline">
          Ma page
        </Link>
        . Aperçu public :{" "}
        <Link
          href={`/producteurs/${slug}`}
          className="font-semibold text-[var(--text-brand)] hover:underline"
        >
          ma fiche
        </Link>
        .
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "border-green-700 text-green-900"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
      )}
    >
      {children}
    </button>
  );
}

const STOCK_MODES: { value: "global" | "format"; label: string }[] = [
  { value: "global", label: "Stock global" },
  { value: "format", label: "Stock par format" },
];

function ProductRow({
  product,
  onMutated,
  flash,
}: {
  product: Product;
  onMutated: () => void;
  flash: Flash;
}) {
  const base = {
    name: product.name,
    category: product.category,
    unit: product.unit,
    vatRate: vatKey(product.vatRate),
    description: product.description,
    stockMode: product.stockMode,
    stock: product.stock,
    stockUnit: product.stockUnit,
    formats: product.formats,
  };
  const [d, setD] = useState(base);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const dirty =
    d.name !== base.name ||
    d.category !== base.category ||
    d.unit !== base.unit ||
    d.vatRate !== base.vatRate ||
    d.description !== base.description ||
    d.stockMode !== base.stockMode ||
    d.stock !== base.stock ||
    d.stockUnit !== base.stockUnit ||
    JSON.stringify(d.formats) !== JSON.stringify(base.formats);

  const setFmt = (i: number, patch: Partial<SaleFormatInput>) =>
    setD((s) => ({
      ...s,
      formats: s.formats.map((f, k) => (k === i ? { ...f, ...patch } : f)),
    }));
  const addFmt = () => setD((s) => ({ ...s, formats: [...s.formats, newFormat()] }));
  const removeFmt = (i: number) =>
    setD((s) => ({ ...s, formats: s.formats.filter((_, k) => k !== i) }));

  function save() {
    if (!d.name.trim()) return flash("err", "Le nom ne peut pas être vide.");
    if (!d.formats.some((f) => f.label.trim())) {
      return flash("err", "Ajoutez au moins un format de vente (avec un libellé).");
    }
    start(async () => {
      const r = await updateProduct(product.id, {
        name: d.name,
        category: d.category,
        unit: d.unit,
        vatRate: d.vatRate,
        description: d.description,
        formats: d.formats,
        stockMode: d.stockMode,
        stock: d.stock,
        stockUnit: d.stockUnit,
      });
      if ("error" in r) return flash("err", r.error);
      flash("ok", "Produit enregistré.");
      onMutated();
    });
  }

  function toggleActive() {
    start(async () => {
      const r = await updateProduct(product.id, { isActive: !product.isActive });
      if ("error" in r) return flash("err", r.error);
      onMutated();
    });
  }

  function remove() {
    const warn =
      product.orders > 0
        ? `« ${product.name} » a déjà été commandé. Il sera retiré de la vente (l'historique est conservé). Continuer ?`
        : `Supprimer définitivement « ${product.name} » ?`;
    if (!window.confirm(warn)) return;
    start(async () => {
      const r = await deleteProduct(product.id);
      if ("error" in r) return flash("err", r.error);
      flash("ok", r.softDeleted ? "Produit retiré de la vente." : "Produit supprimé.");
      onMutated();
    });
  }

  const fmtCount = product.formats.filter((f) => f.label.trim()).length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)]",
        !product.isActive && "opacity-60",
      )}
    >
      {/* Ligne résumé — toujours visible */}
      <div className="flex items-center gap-3 p-3">
        <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]">
          {product.photoUrl && (
            <Image src={product.photoUrl} alt="" fill className="object-cover" sizes="52px" unoptimized />
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate text-[14px] font-bold text-[var(--text-primary)]">
            {product.name || "Sans nom"}
          </div>
          <div className="truncate text-[12px] text-[var(--text-muted)]">
            {product.category} · {fmtCount} format{fmtCount > 1 ? "s" : ""} · dès{" "}
            {product.price || "0"} € HT
          </div>
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={cn(
            "shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-[12px] font-bold",
            product.isActive
              ? "bg-green-700 text-white"
              : "bg-[var(--surface-sunken)] text-[var(--text-muted)] shadow-[inset_0_0_0_1px_var(--border-default)]",
          )}
        >
          {product.isActive ? "En vente" : "Masqué"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Replier" : "Modifier"}
          className="shrink-0 rounded-[var(--radius-s)] px-2 py-1 text-[13px] font-semibold text-[var(--text-brand)] hover:bg-[var(--surface-sunken)]"
        >
          {open ? "Replier ▲" : "Modifier ▾"}
        </button>
        <button
          type="button"
          className="mp-x shrink-0"
          aria-label="Supprimer ce produit"
          onClick={remove}
          disabled={pending}
        >
          ×
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border-subtle)] p-4">
          <div className="flex gap-4">
            <div className="w-[92px] shrink-0">
              <ImageUpload
                kind="product"
                aspect="square"
                compact
                productId={product.id}
                initialUrl={product.photoUrl || null}
                onChange={() => onMutated()}
              />
            </div>
            <div className="min-w-0 flex-1">
              <input
                className="mp-in w-full"
                value={d.name}
                placeholder="Nom du produit"
                onChange={(e) => setD({ ...d, name: e.target.value })}
              />
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px]">
                <input
                  className="mp-in"
                  list="mp-product-cats"
                  value={d.category}
                  placeholder="Catégorie"
                  onChange={(e) => setD({ ...d, category: e.target.value })}
                />
                <input
                  className="mp-in"
                  value={d.unit}
                  placeholder="Unité de référence"
                  onChange={(e) => setD({ ...d, unit: e.target.value })}
                />
                <select
                  className="mp-in"
                  value={d.vatRate}
                  onChange={(e) => setD({ ...d, vatRate: e.target.value })}
                >
                  <option value="5.5">TVA 5,5 %</option>
                  <option value="10">TVA 10 %</option>
                  <option value="20">TVA 20 %</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formats de vente */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Formats de vente
            </div>
            <div className="flex flex-col gap-2.5">
              {d.formats.map((f, i) => {
                const cu = computedUnitPrice(
                  amt(f.pricePro),
                  f.size.trim() ? amt(f.size) : null,
                  f.sizeUnit,
                );
                return (
                  <div key={f.id} className="rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-3">
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_72px_84px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_28px]">
                      <input
                        className="mp-in"
                        value={f.label}
                        placeholder="Bocal 250 g"
                        onChange={(e) => setFmt(i, { label: e.target.value })}
                      />
                      <input
                        className="mp-in"
                        value={f.size}
                        inputMode="decimal"
                        placeholder="250"
                        onChange={(e) => setFmt(i, { size: e.target.value })}
                      />
                      <input
                        className="mp-in"
                        list="mp-size-units"
                        value={f.sizeUnit}
                        placeholder="g"
                        onChange={(e) => setFmt(i, { sizeUnit: e.target.value })}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          className="mp-in min-w-0"
                          value={f.pricePro}
                          inputMode="decimal"
                          placeholder="Prix pro"
                          onChange={(e) => setFmt(i, { pricePro: e.target.value })}
                        />
                        <span className="shrink-0 text-[11px] text-[var(--text-muted)]">€ HT</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          className="mp-in min-w-0"
                          value={f.priceRetail}
                          inputMode="decimal"
                          placeholder="Conseillé"
                          onChange={(e) => setFmt(i, { priceRetail: e.target.value })}
                        />
                        <span className="shrink-0 text-[11px] text-[var(--text-muted)]">€</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          className="mp-in min-w-0"
                          value={f.unitPrice}
                          inputMode="decimal"
                          placeholder={cu ? `≈ ${fmtMoney(cu.value)}` : "au kg/L"}
                          onChange={(e) => setFmt(i, { unitPrice: e.target.value })}
                        />
                        <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                          €/{cu?.base ?? "u"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mp-x"
                        aria-label="Retirer ce format"
                        onClick={() => removeFmt(i)}
                        disabled={d.formats.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                    {d.stockMode === "format" && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-muted)]">Stock de ce format</span>
                        <input
                          className="mp-in max-w-[130px]"
                          value={f.stock}
                          inputMode="decimal"
                          placeholder="ex. 120"
                          onChange={(e) => setFmt(i, { stock: e.target.value })}
                        />
                      </div>
                    )}
                    {cu && f.unitPrice.trim() === "" && (
                      <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                        Prix pro à l&apos;unité calculé : ≈ {fmtMoney(cu.value)} €/{cu.base}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button type="button" className="mp-add mt-2" onClick={addFmt}>
              + Ajouter un format
            </button>
          </div>

          {/* Stock */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
              Stock
            </div>
            <div className="flex flex-wrap gap-2">
              {STOCK_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setD({ ...d, stockMode: m.value })}
                  className={cn(
                    "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[12px] font-bold",
                    d.stockMode === m.value
                      ? "bg-green-700 text-white"
                      : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)]",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {d.stockMode === "global" ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  className="mp-in max-w-[140px]"
                  value={d.stock}
                  inputMode="decimal"
                  placeholder="Quantité"
                  onChange={(e) => setD({ ...d, stock: e.target.value })}
                />
                <input
                  className="mp-in max-w-[220px]"
                  value={d.stockUnit}
                  placeholder="bouteilles, kg, caisses…"
                  onChange={(e) => setD({ ...d, stockUnit: e.target.value })}
                />
                <span className="text-[12px] text-[var(--text-muted)]">
                  au total pour ce produit, quels que soient les formats
                </span>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                Renseignez le stock dans chaque format ci-dessus.
              </p>
            )}
          </div>

          <textarea
            className="mp-in mt-4"
            rows={2}
            value={d.description}
            placeholder="Description — une ou deux phrases sur ce produit (visible sur la fiche produit)"
            onChange={(e) => setD({ ...d, description: e.target.value })}
          />

          {dirty && (
            <div className="mt-3 flex items-center gap-3">
              <Button type="button" size="sm" onClick={save} disabled={pending}>
                Enregistrer
              </Button>
              <button
                type="button"
                onClick={() => setD(base)}
                className="text-[13px] font-semibold text-[var(--text-muted)] hover:underline"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
