"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BlocksEditor, cleanBlocks } from "@/components/admin/BlocksEditor";
import { SeoPanel } from "@/components/admin/SeoPanel";
import { StatusField } from "@/components/admin/StatusField";
import { slugify } from "@/lib/slug";
import type { Block } from "@/lib/content";
import { createPage, updatePage, deletePage, type PageActionState } from "@/lib/actions/admin-pages";

export type PageFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledAt: string;
  body: Block[];
};

export function PageEditor({ initial }: { initial?: PageFormValues }) {
  const isEdit = Boolean(initial?.id);
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "DRAFT");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initial?.body ?? [{ t: "p", text: "" }]);

  const action = isEdit ? updatePage.bind(null, initial!.id!) : createPage;
  const [state, submit, pending] = useActionState<PageActionState, FormData>(action, undefined);

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Supprimer définitivement « ${initial.title} » ?`)) return;
    const res = await deletePage(initial.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.push("/admin/pages");
  }

  return (
    <form action={submit} className="flex flex-col gap-7">
      <input type="hidden" name="body" value={JSON.stringify(cleanBlocks(blocks))} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[26px] text-[var(--text-primary)]">
          {isEdit ? "Modifier la page" : "Nouvelle page"}
        </h1>
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-[13px] font-semibold text-[var(--state-danger)] hover:underline"
            >
              Supprimer
            </button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-[1.4fr_1fr] items-start gap-7">
        <div className="flex flex-col gap-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
          <Input
            name="title"
            label="Titre (H1)"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="À propos"
            required
          />
          <Input
            name="slug"
            label="Slug (adresse de la page)"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            helper="Ex : a-propos, legal/cgu, aide/faq"
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
              Chapô (résumé court)
            </span>
            <textarea
              name="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
            />
          </label>

          <div className="h-px bg-[var(--border-subtle)]" />

          <BlocksEditor blocks={blocks} onChange={setBlocks} />
        </div>

        <div className="flex flex-col gap-5">
          <StatusField status={status} setStatus={setStatus} scheduledAt={scheduledAt} setScheduledAt={setScheduledAt} />
          <SeoPanel
            title={title}
            slug={slug}
            excerpt={excerpt}
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
            body={cleanBlocks(blocks)}
          />
        </div>
      </div>
    </form>
  );
}
