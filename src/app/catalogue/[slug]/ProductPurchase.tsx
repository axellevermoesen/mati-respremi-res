"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/actions/cart";

export function ProductPurchase({
  productId,
  unitPrice,
  canOrder,
}: {
  productId: string;
  unitPrice: number;
  canOrder: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, start] = useTransition();

  const total = (unitPrice * qty).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const add = () => {
    setError(undefined);
    start(async () => {
      const r = await addToCart(productId, qty);
      if (r && "error" in r) setError(r.error);
      else setAdded(true);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-[var(--radius-m)] shadow-[inset_0_0_0_1px_var(--border-default)]">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-12 w-11 text-[20px] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
            aria-label="Diminuer"
          >
            −
          </button>
          <span className="min-w-[52px] text-center font-display text-[17px] text-[var(--text-primary)]">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(999, q + 1))}
            className="h-12 w-11 text-[20px] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]"
            aria-label="Augmenter"
          >
            +
          </button>
        </div>

        {canOrder ? (
          added ? (
            <Link
              href="/panier"
              className="flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-m)] bg-green-900 text-[15px] font-bold text-white"
            >
              ✓ Ajouté — voir le panier
            </Link>
          ) : (
            <button
              type="button"
              onClick={add}
              disabled={busy}
              className="flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-[var(--radius-m)] bg-green-700 text-[15px] font-bold text-white hover:bg-green-900 disabled:opacity-60"
            >
              {busy ? "Ajout…" : `Ajouter au panier — ${total} € HT`}
            </button>
          )
        ) : (
          <Link
            href="/connexion?role=acheteur"
            className="flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-[var(--radius-m)] bg-green-700 text-[15px] font-bold text-white hover:bg-green-900"
          >
            Se connecter pour commander
          </Link>
        )}
      </div>
      {error && <p className="text-[13px] font-medium text-[var(--state-danger)]">{error}</p>}
    </div>
  );
}
