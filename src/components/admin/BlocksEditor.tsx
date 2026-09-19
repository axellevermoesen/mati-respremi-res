"use client";

import { useRef } from "react";
import { slugify } from "@/lib/slug";
import { normalizeUrl } from "@/lib/inline";
import type { Block } from "@/lib/content";

type BlockType = Block["t"];

const BLOCK_LABELS: Record<BlockType, string> = {
  p: "Paragraphe",
  h2: "Sous-titre (H2)",
  h3: "Sous-titre (H3)",
  quote: "Citation",
  list: "Liste numérotée",
  callout: "Encadré",
  img: "Image",
};

/**
 * Retire les blocs vides (ajoutés puis jamais remplis) et les lignes vides
 * dans les listes/encadrés, pour ne jamais bloquer l'enregistrement à cause
 * d'un bloc oublié — plutôt que de rejeter tout le contenu avec une erreur.
 */
export function cleanBlocks(blocks: Block[]): Block[] {
  return blocks
    .map((b): Block | null => {
      switch (b.t) {
        case "p":
        case "h2":
        case "h3":
        case "quote":
          return b.text.trim() ? b : null;
        case "list": {
          const items = b.items.map((i) => i.trim()).filter(Boolean);
          return items.length ? { ...b, items } : null;
        }
        case "callout": {
          const items = b.items.map((i) => i.trim()).filter(Boolean);
          return b.kicker.trim() && items.length ? { ...b, items } : null;
        }
        case "img":
          return b.src.trim() ? b : null;
      }
    })
    .filter((b): b is Block => b !== null);
}

function newBlock(t: BlockType): Block {
  switch (t) {
    case "p":
      return { t: "p", text: "" };
    case "h2":
      return { t: "h2", text: "", id: "" };
    case "h3":
      return { t: "h3", text: "", id: "" };
    case "quote":
      return { t: "quote", text: "", cite: "" };
    case "list":
      return { t: "list", items: [""] };
    case "callout":
      return { t: "callout", kicker: "", items: [""] };
    case "img":
      return { t: "img", src: "", alt: "", caption: "" };
  }
}

export function BlocksEditor({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  function updateBlock(i: number, next: Block) {
    onChange(blocks.map((b, idx) => (idx === i ? next : b)));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }
  function removeBlock(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function addBlock(t: BlockType) {
    onChange([...blocks, newBlock(t)]);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {blocks.map((b, i) => (
          <BlockEditor
            key={i}
            block={b}
            onChange={(next) => updateBlock(i, next)}
            onUp={i > 0 ? () => moveBlock(i, -1) : undefined}
            onDown={i < blocks.length - 1 ? () => moveBlock(i, 1) : undefined}
            onRemove={blocks.length > 1 ? () => removeBlock(i) : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addBlock(t)}
            className="rounded-[var(--radius-s)] bg-[var(--surface-sunken)] px-3 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--sand-200)]"
          >
            + {BLOCK_LABELS[t]}
          </button>
        ))}
      </div>
    </>
  );
}

function BlockEditor({
  block,
  onChange,
  onUp,
  onDown,
  onRemove,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onUp?: () => void;
  onDown?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-m)] bg-[var(--surface-sunken)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          {BLOCK_LABELS[block.t]}
        </span>
        <div className="flex items-center gap-1">
          {onUp && (
            <button type="button" onClick={onUp} className="px-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Monter">
              ↑
            </button>
          )}
          {onDown && (
            <button type="button" onClick={onDown} className="px-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Descendre">
              ↓
            </button>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} className="px-1.5 text-[var(--state-danger)]" aria-label="Supprimer ce bloc">
              ×
            </button>
          )}
        </div>
      </div>

      {block.t === "p" && (
        <RichTextarea
          rows={3}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Texte du paragraphe…"
        />
      )}

      {(block.t === "h2" || block.t === "h3") && (
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value, id: slugify(e.target.value) })}
          placeholder="Sous-titre…"
          className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2.5 text-[14px] font-semibold shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
        />
      )}

      {block.t === "quote" && (
        <div className="flex flex-col gap-2">
          <RichTextarea
            rows={2}
            value={block.text}
            onChange={(text) => onChange({ ...block, text })}
            placeholder="Texte de la citation…"
          />
          <input
            value={block.cite ?? ""}
            onChange={(e) => onChange({ ...block, cite: e.target.value })}
            placeholder="Source (facultatif)"
            className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2 text-[13px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
          />
        </div>
      )}

      {block.t === "list" && (
        <RichTextarea
          rows={4}
          value={block.items.join("\n")}
          onChange={(text) => onChange({ ...block, items: text.split("\n") })}
          placeholder={"Un élément par ligne…"}
        />
      )}

      {block.t === "callout" && (
        <div className="flex flex-col gap-2">
          <input
            value={block.kicker}
            onChange={(e) => onChange({ ...block, kicker: e.target.value })}
            placeholder="Titre de l'encadré (ex : En bref)"
            className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2 text-[13px] font-semibold shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
          />
          <RichTextarea
            rows={4}
            value={block.items.join("\n")}
            onChange={(text) => onChange({ ...block, items: text.split("\n") })}
            placeholder={"Un élément par ligne…"}
          />
        </div>
      )}

      {block.t === "img" && (
        <div className="flex flex-col gap-2">
          <input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            placeholder="/img/mon-image.jpeg"
            className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2 text-[13px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Texte alternatif (description de l'image)"
            className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2 text-[13px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Légende (facultatif)"
            className="w-full rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2 text-[13px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Zone de texte avec barre d'outils : Gras, Italique, Lien.
 * On sélectionne un mot, on clique — le texte est entouré des bons signes
 * (**gras**, *italique*, [texte](adresse)), que le site public transforme en vraie mise en forme.
 */
function RichTextarea({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(kind: "b" | "i" | "a") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    let insert: string;
    let innerStart: number;
    let inner: string;
    if (kind === "a") {
      const raw = window.prompt("Adresse du lien (ex : https://exemple.fr ou /blog)");
      if (!raw || !raw.trim()) return;
      inner = selected || "texte du lien";
      insert = `[${inner}](${normalizeUrl(raw)})`;
      innerStart = start + 1;
    } else {
      const mark = kind === "b" ? "**" : "*";
      inner = selected || (kind === "b" ? "texte en gras" : "texte en italique");
      insert = `${mark}${inner}${mark}`;
      innerStart = start + mark.length;
    }

    onChange(value.slice(0, start) + insert + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(innerStart, innerStart + inner.length);
    });
  }

  const btn =
    "rounded-[var(--radius-s)] bg-[var(--surface-card)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)] hover:bg-[var(--sand-100)]";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <button type="button" className={`${btn} font-bold`} onMouseDown={(e) => e.preventDefault()} onClick={() => apply("b")}>
          Gras
        </button>
        <button type="button" className={`${btn} italic`} onMouseDown={(e) => e.preventDefault()} onClick={() => apply("i")}>
          Italique
        </button>
        <button type="button" className={`${btn} underline`} onMouseDown={(e) => e.preventDefault()} onClick={() => apply("a")}>
          Lien
        </button>
        <span className="ml-2 text-[11px] text-[var(--text-muted)]">Sélectionnez du texte, puis cliquez.</span>
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3 py-2.5 text-[14px] leading-relaxed shadow-[inset_0_0_0_1px_var(--border-default)] outline-none"
      />
    </div>
  );
}
