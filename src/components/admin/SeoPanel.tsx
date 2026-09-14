"use client";

import { computeSeoScore } from "@/lib/seo";
import type { Block } from "@/lib/content";

export function SeoPanel({
  title,
  slug,
  excerpt,
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  body,
  slugPrefix = "",
}: {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  body: Block[];
  slugPrefix?: string;
}) {
  const seo = computeSeoScore({ title, metaTitle, metaDescription, body });

  return (
    <div className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Référencement
        </span>
        <span
          className={
            seo.score >= 80
              ? "font-display text-[18px] text-green-700"
              : seo.score >= 50
                ? "font-display text-[18px] text-[hsl(28_60%_45%)]"
                : "font-display text-[18px] text-[var(--state-danger)]"
          }
        >
          {seo.score}/100
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--sand-200)]">
        <div
          className={
            seo.score >= 80
              ? "h-full bg-green-700"
              : seo.score >= 50
                ? "h-full bg-[hsl(28_60%_55%)]"
                : "h-full bg-[var(--state-danger)]"
          }
          style={{ width: `${seo.score}%` }}
        />
      </div>

      <div className="mt-5 rounded-[var(--radius-s)] bg-[var(--surface-sunken)] p-4">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Aperçu Google
        </div>
        <div className="mt-2 text-[13px] text-[var(--accent-structural,#73986f)]">
          matierespremieres.fr › {slugPrefix}
          {slug || "…"}
        </div>
        <div className="text-[16px] text-[#1a0dab]">{metaTitle || title || "Titre"}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {metaDescription || excerpt || "Description à renseigner…"}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-[13px] font-semibold text-[var(--text-secondary)]">
            <span>Meta title</span>
            <span className="text-[12px] text-[var(--text-muted)]">{metaTitle.length}/60</span>
          </span>
          <input
            name="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-2.5 text-[14px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-[13px] font-semibold text-[var(--text-secondary)]">
            <span>Meta description</span>
            <span className="text-[12px] text-[var(--text-muted)]">{metaDescription.length}/160</span>
          </span>
          <textarea
            name="metaDescription"
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4">
        {seo.checks.map((c) => (
          <div key={c.label} className="flex items-start gap-2 text-[13px]">
            <span className={c.ok ? "text-green-700" : "text-[hsl(28_60%_45%)]"}>{c.ok ? "✓" : "!"}</span>
            <span className={c.ok ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
