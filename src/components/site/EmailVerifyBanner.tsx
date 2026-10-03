"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/lib/actions/auth";

/**
 * Bandeau en haut du tableau de bord :
 *  - adresse pas encore confirmée → rappel + bouton « Renvoyer le lien »
 *  - retour du lien de confirmation → message de succès ou « lien expiré »
 */
export function EmailVerifyBanner({
  verified,
  notice,
}: {
  verified: boolean;
  notice?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (notice === "confirme" && verified) {
    return (
      <Box tone="ok">Merci, votre adresse e-mail est confirmée.</Box>
    );
  }
  if (verified) return null;

  return (
    <Box tone="warn">
      <span>
        {notice === "lien-expire"
          ? "Ce lien de confirmation a expiré. "
          : "Confirmez votre adresse e-mail : on vous a envoyé un lien à l'inscription. "}
      </span>
      {sent ? (
        <span className="font-semibold">Nouveau lien envoyé ✓</span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await resendVerificationAction();
              if (res.sent) setSent(true);
            })
          }
          className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Renvoyer le lien"}
        </button>
      )}
    </Box>
  );
}

function Box({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={
        "mb-6 rounded-[var(--radius-m)] px-4 py-3 text-[14px] leading-[var(--leading-relaxed)] " +
        (tone === "ok"
          ? "bg-[hsl(146_25%_35%_/_0.12)] text-green-900"
          : "bg-[hsl(28_60%_88%)] text-[hsl(28_60%_30%)]")
      }
    >
      {children}
    </div>
  );
}
