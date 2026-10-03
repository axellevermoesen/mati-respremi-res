import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] px-6 py-16">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="font-display text-[18px] tracking-[var(--tracking-tight)] text-[var(--text-brand)]"
        >
          Matières Premières
        </Link>
        <div className="mt-10 mb-3.5 flex items-center gap-2.5">
          <div className="h-0.5 w-7 bg-rose-600" />
          <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
            Réinitialisation
          </div>
        </div>
        <h1 className="font-display text-[30px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
          Nouveau mot de passe
        </h1>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="mt-4 text-[15px] text-[var(--text-secondary)]">
            Ce lien est incomplet. Refais une demande depuis la{" "}
            <Link href="/connexion" className="font-semibold text-rose-600 hover:underline">
              page de connexion
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
