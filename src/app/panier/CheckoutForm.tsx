"use client";

import { useActionState } from "react";
import { checkout, addDeliveryAddress } from "@/lib/actions/cart";

type Address = {
  id: string;
  label: string;
  line1: string;
  postcode: string;
  city: string;
};

export function CheckoutForm({
  addresses,
  canCheckout,
  blockedReason,
}: {
  addresses: Address[];
  canCheckout: boolean;
  blockedReason?: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | undefined, fd: FormData) => {
      const r = await checkout(fd);
      return r ?? undefined;
    },
    undefined,
  );

  const [addrState, addrAction, addrPending] = useActionState(
    async (_prev: { error?: string } | undefined, fd: FormData) => {
      const r = await addDeliveryAddress(fd);
      return r ?? undefined;
    },
    undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Adresse de livraison
        </div>
        {addresses.length > 0 ? (
          <form action={action} className="flex flex-col gap-2.5">
            {addresses.map((a, i) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-m)] bg-[var(--surface-card)] p-3.5 shadow-[inset_0_0_0_1px_var(--border-subtle)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--green-700)]"
              >
                <input
                  type="radio"
                  name="addressId"
                  value={a.id}
                  defaultChecked={i === 0}
                  className="mt-0.5 accent-[var(--green-700)]"
                />
                <span className="text-[13px] leading-normal">
                  <span className="font-bold text-[var(--text-primary)]">{a.label}</span>
                  <br />
                  <span className="text-[var(--text-secondary)]">
                    {a.line1}, {a.postcode} {a.city}
                  </span>
                </span>
              </label>
            ))}

            {state?.error && (
              <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.1)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
                {state.error}
              </p>
            )}
            {blockedReason && !state?.error && (
              <p className="text-[13px] font-medium text-[var(--state-danger)]">{blockedReason}</p>
            )}

            <button
              type="submit"
              disabled={pending || !canCheckout}
              className="mt-1 h-12 rounded-[var(--radius-m)] bg-green-700 text-[15px] font-bold text-white hover:bg-green-900 disabled:opacity-50"
            >
              {pending ? "Validation…" : "Valider ma commande"}
            </button>
            <p className="text-center text-[12px] text-[var(--text-muted)]">
              Paiement sur facture — vous réglez directement chaque producteur. Le paiement en ligne
              arrivera plus tard.
            </p>
          </form>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">
            Ajoutez une adresse de livraison pour valider votre commande.
          </p>
        )}
      </div>

      <details className="rounded-[var(--radius-m)] bg-[var(--surface-card)] p-3.5 shadow-[inset_0_0_0_1px_var(--border-subtle)]">
        <summary className="cursor-pointer text-[13px] font-semibold text-[var(--text-brand)]">
          + Ajouter une adresse
        </summary>
        <form action={addrAction} className="mt-3 flex flex-col gap-2.5">
          <input name="label" placeholder="Nom (Cuisine, Réserve…)" className="mp-in" />
          <input name="line1" placeholder="Adresse *" className="mp-in" required />
          <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
            <input name="postcode" placeholder="Code postal *" className="mp-in" required />
            <input name="city" placeholder="Ville *" className="mp-in" required />
          </div>
          <input name="notes" placeholder="Créneau de réception, code d'accès…" className="mp-in" />
          {addrState?.error && (
            <p className="text-[12px] font-medium text-[var(--state-danger)]">{addrState.error}</p>
          )}
          <button
            type="submit"
            disabled={addrPending}
            className="mp-add self-start disabled:opacity-50"
          >
            {addrPending ? "Ajout…" : "Enregistrer l'adresse"}
          </button>
        </form>
      </details>
    </div>
  );
}
