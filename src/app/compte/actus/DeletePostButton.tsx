"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions/posts";

/** Supprimer une actu, en deux clics (pas de fenêtre de confirmation du navigateur). */
export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--state-danger)]"
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-[13px]">
      {error && <span className="text-[var(--state-danger)]">{error}</span>}
      <span className="text-[var(--text-secondary)]">Supprimer cette actu ?</span>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          start(async () => {
            const res = await deletePost(id);
            if ("error" in res) setError(res.error);
            else router.refresh();
          })
        }
        className="font-bold text-[var(--state-danger)] hover:underline"
      >
        {busy ? "…" : "Oui, supprimer"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="font-semibold text-[var(--text-muted)] hover:underline"
      >
        Annuler
      </button>
    </span>
  );
}
