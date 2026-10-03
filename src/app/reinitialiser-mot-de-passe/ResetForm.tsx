"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetForm({ token }: { token: string }) {
  const [state, submit, pending] = useActionState(resetPasswordAction, undefined);

  if (state?.done) {
    return (
      <div className="mt-4">
        <p className="text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
          C&apos;est fait : ton mot de passe a été changé. Tu peux te connecter avec le nouveau.
        </p>
        <Button href="/connexion" size="lg" className="mt-6 w-full">
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <form action={submit} className="mt-7 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Input
        name="password"
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        required
        helper="8 caractères minimum."
        placeholder="••••••••"
      />
      <Input
        name="confirm"
        label="Confirme le mot de passe"
        type="password"
        autoComplete="new-password"
        required
        placeholder="••••••••"
      />
      {state?.error && (
        <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
