"use client";

import { useState, useTransition } from "react";
import { advanceOrder, cancelOrder } from "@/lib/actions/orders";

export function OrderActions({
  reference,
  nextLabel,
  canCancel,
}: {
  reference: string;
  nextLabel: string | null;
  canCancel: boolean;
}) {
  const [error, setError] = useState<string>();
  const [busy, start] = useTransition();

  if (!nextLabel && !canCancel) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {nextLabel && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const r = await advanceOrder(reference);
                if ("error" in r) setError(r.error);
              })
            }
            className="h-11 rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-bold text-white hover:bg-green-900 disabled:opacity-50"
          >
            {busy ? "…" : nextLabel}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const r = await cancelOrder(reference);
                if ("error" in r) setError(r.error);
              })
            }
            className="h-11 rounded-[var(--radius-m)] px-5 text-[14px] font-semibold text-[var(--state-danger)] shadow-[inset_0_0_0_1.5px_var(--state-danger)] hover:bg-[hsl(9_49%_48%_/_0.06)] disabled:opacity-50"
          >
            Annuler la commande
          </button>
        )}
      </div>
      {error && <p className="text-[13px] font-medium text-[var(--state-danger)]">{error}</p>}
    </div>
  );
}
