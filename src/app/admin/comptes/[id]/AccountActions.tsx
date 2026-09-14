"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { setAccountStatus, deleteAccount } from "@/lib/actions/admin-accounts";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de validation",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};

export function AccountActions({
  userId,
  status,
  orderCount,
}: {
  userId: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  orderCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeStatus(next: "PENDING" | "ACTIVE" | "SUSPENDED") {
    setError(null);
    startTransition(async () => {
      const res = await setAccountStatus(userId, next);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer définitivement ce compte ? Cette action est irréversible.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAccount(userId);
      if (res.error) setError(res.error);
      else router.push("/admin/comptes");
    });
  }

  return (
    <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
      <div className="text-[13px] text-[var(--text-muted)]">
        État actuel : <span className="font-semibold text-[var(--text-primary)]">{STATUS_LABEL[status]}</span>
      </div>

      {error && (
        <p className="mt-3 rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {status === "PENDING" && (
          <Button onClick={() => changeStatus("ACTIVE")} disabled={pending}>
            Valider et rendre visible
          </Button>
        )}
        {status === "ACTIVE" && (
          <Button variant="outline" onClick={() => changeStatus("SUSPENDED")} disabled={pending}>
            Suspendre
          </Button>
        )}
        {status === "SUSPENDED" && (
          <Button onClick={() => changeStatus("ACTIVE")} disabled={pending}>
            Réactiver
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-[var(--state-danger)]"
          onClick={handleDelete}
          disabled={pending}
        >
          Supprimer le compte
        </Button>
      </div>
      {orderCount > 0 && (
        <p className="mt-3 text-[12px] text-[var(--text-muted)]">
          Ce compte a {orderCount} commande(s) : la suppression sera refusée, utilisez « Suspendre ».
        </p>
      )}
    </div>
  );
}
