"use client";

import { useActionState, useTransition } from "react";
import { createTour, joinTour } from "@/lib/actions/tours";

export function CreateTourForm({ region }: { region: string }) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | undefined, fd: FormData) => (await createTour(fd)) ?? undefined,
    undefined,
  );
  const today = new Date();
  const min = today.toISOString().slice(0, 10);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-s)]"
    >
      <div className="font-display text-[16px] text-[var(--text-primary)]">Créer une tournée</div>
      <p className="text-[13px] text-[var(--text-secondary)]">
        Région : <strong>{region || "à renseigner dans Ma page"}</strong> — les producteurs de la même
        région pourront la rejoindre.
      </p>
      <label className="flex flex-col gap-1">
        <span className="mp-lab">Date de la tournée</span>
        <input type="date" name="date" min={min} required className="mp-in" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="mp-lab">Note (facultatif)</span>
        <input name="notes" placeholder="Départ 6 h, priorité produits frais…" className="mp-in" />
      </label>
      {state?.error && (
        <p className="text-[12px] font-medium text-[var(--state-danger)]">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-[var(--radius-m)] bg-green-700 text-[14px] font-bold text-white hover:bg-green-900 disabled:opacity-50"
      >
        {pending ? "Création…" : "Créer la tournée"}
      </button>
    </form>
  );
}

export function JoinButton({ tourId }: { tourId: string }) {
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => start(() => void joinTour(tourId))}
      className="h-9 rounded-[var(--radius-m)] bg-green-700 px-4 text-[13px] font-bold text-white hover:bg-green-900 disabled:opacity-50"
    >
      {busy ? "…" : "Rejoindre"}
    </button>
  );
}
