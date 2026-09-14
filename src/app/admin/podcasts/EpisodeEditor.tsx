"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusField } from "@/components/admin/StatusField";
import { slugify } from "@/lib/slug";
import { episodeDuration } from "@/lib/content";
import {
  createEpisode,
  updateEpisode,
  deleteEpisode,
  type EpisodeActionState,
} from "@/lib/actions/admin-episodes";

export type EpisodeFormValues = {
  id?: string;
  title: string;
  slug: string;
  num: string;
  excerpt: string;
  topic: string;
  guest: string;
  role: string;
  initials: string;
  img: string;
  seconds: number;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledAt: string;
};

export function EpisodeEditor({ initial }: { initial?: EpisodeFormValues }) {
  const isEdit = Boolean(initial?.id);
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [num, setNum] = useState(initial?.num ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [guest, setGuest] = useState(initial?.guest ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [initials, setInitials] = useState(initial?.initials ?? "");
  const [img, setImg] = useState(initial?.img ?? "");
  const [minutes, setMinutes] = useState(initial ? String(Math.round(initial.seconds / 60)) : "");
  const [status, setStatus] = useState<string>(initial?.status ?? "DRAFT");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");

  const action = isEdit ? updateEpisode.bind(null, initial!.id!) : createEpisode;
  const [state, submit, pending] = useActionState<EpisodeActionState, FormData>(action, undefined);

  const seconds = Math.max(0, Math.round((parseFloat(minutes) || 0) * 60));

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Supprimer définitivement « Ép. ${initial.num} — ${initial.title} » ?`)) return;
    const res = await deleteEpisode(initial.id);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.push("/admin/podcasts");
  }

  return (
    <form action={submit} className="flex max-w-[720px] flex-col gap-7">
      <input type="hidden" name="seconds" value={seconds} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[26px] text-[var(--text-primary)]">
          {isEdit ? "Modifier l'épisode" : "Nouvel épisode"}
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

      <div className="flex flex-col gap-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
        <div className="grid grid-cols-[100px_1fr] gap-4">
          <Input name="num" label="N° épisode" value={num} onChange={(e) => setNum(e.target.value)} placeholder="07" required />
          <Input
            name="title"
            label="Titre"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="On a suivi une palette de carottes"
            required
          />
        </div>
        <Input
          name="slug"
          label="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          helper="Identifiant interne, ex : ep-07-mon-titre"
          required
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Résumé</span>
          <textarea
            name="excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Input name="topic" label="Rubrique" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Maraîchage" required />
          <Input name="img" label="Image" value={img} onChange={(e) => setImg(e.target.value)} placeholder="/img/farm-1.jpeg" />
          <Input name="guest" label="Invité·e" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Nadia Cheballah" required />
          <Input name="role" label="Rôle" value={role} onChange={(e) => setRole(e.target.value)} placeholder="maraîchère, Drôme" />
          <Input name="initials" label="Initiales" value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="NC" />
          <Input
            label="Durée (minutes)"
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            helper={seconds > 0 ? `Affiché : ${episodeDuration(seconds).durationLabel}` : undefined}
            required
          />
        </div>
      </div>

      <StatusField status={status} setStatus={setStatus} scheduledAt={scheduledAt} setScheduledAt={setScheduledAt} />
    </form>
  );
}
