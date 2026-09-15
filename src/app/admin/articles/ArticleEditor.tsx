"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { BlocksEditor, cleanBlocks } from "@/components/admin/BlocksEditor";
import { SeoPanel } from "@/components/admin/SeoPanel";
import { StatusField } from "@/components/admin/StatusField";
import { slugify } from "@/lib/slug";
import type { Block } from "@/lib/content";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  type ArticleActionState,
} from "@/lib/actions/admin-articles";

export type ArticleFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  topic: string;
  img: string;
  author: string;
  authorInitials: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledAt: string;
  body: Block[];
};

export function ArticleEditor({ initial }: { initial?: ArticleFormValues }) {
  const isEdit = Boolean(initial?.id);
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [img, setImg] = useState(initial?.img ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "Axelle Vermoesen");
  const [authorInitials, setAuthorInitials] = useState(initial?.authorInitials ?? "AV");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "DRAFT");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initial?.body ?? [{ t: "p", text: "" }]);

  const action = isEdit ? updateArticle.bind(null, initial!.id!) : createArticle;
  const [state, submit, pending] = useActionState<ArticleActionState, FormData>(action, undefined);

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Supprimer définitivement « ${initial.title} » ?`)) return;
    const res = await deleteArticle(initial.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.push("/admin/articles");
  }

  return (
    <form action={submit} className="flex flex-col gap-7">
      <input type="hidden" name="body" value={JSON.stringify(cleanBlocks(blocks))} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[26px] text-[var(--text-primary)]">
          {isEdit ? "Modifier l'article" : "Nouvel article"}
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
            placeholder="Ce que ton steak a vu…"
            required
          />
          <Input
            name="slug"
            label="Slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            helper="Adresse : /blog/…"
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Chapô</span>
            <textarea
              name="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Input name="topic" label="Rubrique" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Impact" required />
            <Input name="img" label="Image de couverture" value={img} onChange={(e) => setImg(e.target.value)} placeholder="/img/farm-1.jpeg" />
            <Input name="author" label="Auteur·rice" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <Input name="authorInitials" label="Initiales" value={authorInitials} onChange={(e) => setAuthorInitials(e.target.value)} />
          </div>
          <Checkbox
            name="featured"
            label="Mettre à la une du blog"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />

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
            slugPrefix="blog/"
          />
        </div>
      </div>
    </form>
  );
}
