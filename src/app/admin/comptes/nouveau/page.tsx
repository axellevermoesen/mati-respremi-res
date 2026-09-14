"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createAccount } from "@/lib/actions/admin-accounts";

const ROLES = [
  { value: "PRODUCER", label: "Producteur" },
  { value: "RESTAURANT", label: "Restaurateur" },
  { value: "RESELLER", label: "Revendeur" },
];

export default function NewAccountPage() {
  const [state, submit, pending] = useActionState(createAccount, undefined);

  if (state?.tempPassword) {
    return (
      <div className="max-w-[560px] rounded-[var(--radius-l)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)]">
        <h1 className="font-display text-[24px] text-green-900">Compte créé</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Transmettez ces identifiants à la personne concernée — ils ne seront plus affichés
          ensuite. Aucun email n&apos;est envoyé automatiquement pour l&apos;instant.
        </p>
        <div className="mt-5 rounded-[var(--radius-s)] bg-[var(--surface-sunken)] p-4 font-mono text-[14px]">
          <div>Mot de passe provisoire : {state.tempPassword}</div>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href="/admin/comptes"
            className="inline-flex h-11 items-center rounded-[var(--radius-m)] bg-green-700 px-5 text-[14px] font-semibold text-white hover:bg-green-900"
          >
            Retour aux comptes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px]">
      <h1 className="font-display text-[26px] text-[var(--text-primary)]">Créer un compte</h1>
      <p className="mt-2 text-[14px] text-[var(--text-muted)]">
        Le compte est créé directement actif (pas d&apos;étape de validation).
      </p>

      <form action={submit} className="mt-6 flex flex-col gap-5 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-m)]">
        <Select name="role" label="Type de compte" options={ROLES} placeholder="Choisir" />
        <Input name="companyName" label="Nom de la structure" placeholder="Ferme des Hauts Prés" required />
        <Input name="email" type="email" label="Email" placeholder="contact@ferme.fr" required />

        {state?.error && (
          <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
            {state.error}
          </p>
        )}

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Création…" : "Créer le compte"}
          </Button>
        </div>
      </form>
    </div>
  );
}
