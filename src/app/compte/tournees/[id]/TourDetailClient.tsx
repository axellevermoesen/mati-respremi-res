"use client";

import { useState, useTransition } from "react";
import {
  advanceTour,
  leaveTour,
  setTourDriver,
  addOrdersToTour,
  removeOrderFromTour,
} from "@/lib/actions/tours";

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[12px] font-medium text-[var(--state-danger)]">{msg}</p>;
}

export function TourControls({
  tourId,
  nextLabel,
  members,
  driverId,
  amMember,
}: {
  tourId: string;
  nextLabel: string | null;
  members: { producerId: string; farmName: string }[];
  driverId: string | null;
  amMember: boolean;
}) {
  const [error, setError] = useState<string>();
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string } | { ok: true }>) =>
    start(async () => {
      setError(undefined);
      const r = await fn();
      if (r && "error" in r) setError(r.error);
    });

  return (
    <div className="flex flex-col gap-3">
      {amMember && (
        <label className="flex flex-col gap-1">
          <span className="mp-lab">Chauffeur du jour</span>
          <select
            className="mp-in"
            value={driverId ?? ""}
            disabled={busy}
            onChange={(e) => run(() => setTourDriver(tourId, e.target.value))}
          >
            <option value="" disabled>
              Choisir un producteur
            </option>
            {members.map((m) => (
              <option key={m.producerId} value={m.producerId}>
                {m.farmName}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {amMember && nextLabel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => advanceTour(tourId))}
            className="h-11 rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-bold text-white hover:bg-green-900 disabled:opacity-50"
          >
            {busy ? "…" : nextLabel}
          </button>
        )}
        {amMember && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => leaveTour(tourId))}
            className="h-11 rounded-[var(--radius-m)] px-4 text-[13px] font-semibold text-[var(--state-danger)] shadow-[inset_0_0_0_1.5px_var(--state-danger)] hover:bg-[hsl(9_49%_48%_/_0.06)] disabled:opacity-50"
          >
            Quitter la tournée
          </button>
        )}
      </div>
      <Err msg={error} />
    </div>
  );
}

export function MyOrdersOnTour({
  tourId,
  attached,
  eligible,
}: {
  tourId: string;
  attached: { id: string; reference: string; town: string; total: string }[];
  eligible: { id: string; reference: string; town: string; total: string }[];
}) {
  const [error, setError] = useState<string>();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, start] = useTransition();

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Mes commandes sur cette tournée
        </div>
        {attached.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">Aucune pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {attached.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-[13px]"
              >
                <span>
                  <span className="font-mono text-[11px] uppercase text-[var(--text-muted)]">
                    {o.reference}
                  </span>{" "}
                  · {o.town} · {o.total} €
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      setError(undefined);
                      const r = await removeOrderFromTour(o.id);
                      if (r && "error" in r) setError(r.error);
                    })
                  }
                  className="text-[12px] font-semibold text-[var(--state-danger)] hover:underline disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {eligible.length > 0 && (
        <div>
          <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Ajouter des commandes
          </div>
          <div className="flex flex-col gap-2">
            {eligible.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-card)] px-3.5 py-2.5 text-[13px] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
              >
                <input
                  type="checkbox"
                  className="accent-[var(--green-700)]"
                  checked={picked.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                <span>
                  <span className="font-mono text-[11px] uppercase text-[var(--text-muted)]">
                    {o.reference}
                  </span>{" "}
                  · {o.town} · {o.total} €
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={busy || picked.length === 0}
            onClick={() =>
              start(async () => {
                setError(undefined);
                const r = await addOrdersToTour(tourId, picked);
                if (r && "error" in r) setError(r.error);
                else setPicked([]);
              })
            }
            className="mt-2.5 h-10 rounded-[var(--radius-m)] bg-green-700 px-4 text-[13px] font-bold text-white hover:bg-green-900 disabled:opacity-40"
          >
            {busy ? "…" : `Ajouter ${picked.length || ""} à la tournée`}
          </button>
        </div>
      )}
      <Err msg={error} />
    </div>
  );
}
