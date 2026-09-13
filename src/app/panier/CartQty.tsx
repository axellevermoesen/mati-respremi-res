"use client";

import { useTransition } from "react";
import { setCartQuantity, removeCartItem } from "@/lib/actions/cart";

export function CartQty({ itemId, quantity }: { itemId: string; quantity: number }) {
  const [busy, start] = useTransition();

  const set = (q: number) => start(() => void setCartQuantity(itemId, q));

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-[var(--radius-m)] shadow-[inset_0_0_0_1px_var(--border-default)]">
        <button
          type="button"
          disabled={busy}
          onClick={() => set(quantity - 1)}
          className="h-9 w-9 text-[18px] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-40"
          aria-label="Diminuer"
        >
          −
        </button>
        <span className="min-w-[40px] text-center font-display text-[15px] text-[var(--text-primary)]">
          {quantity}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => set(quantity + 1)}
          className="h-9 w-9 text-[18px] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-40"
          aria-label="Augmenter"
        >
          +
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => start(() => void removeCartItem(itemId))}
        className="text-[12px] font-semibold text-[var(--state-danger)] hover:underline disabled:opacity-40"
      >
        Retirer
      </button>
    </div>
  );
}
