"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { loginAction, signupAction } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

type Profile = "producteur" | "restaurateur";
type View = "login" | "signup" | "forgot";

const EASE = "520ms cubic-bezier(.4,0,.2,1)";

const PANELS: Record<
  Profile,
  { image: string; alt: string; kicker: string; title: string; body: string }
> = {
  producteur: {
    image: "/img/producer-hand-barrel.jpeg",
    alt: "Main de producteur sur un fût",
    kicker: "Espace producteur",
    title: "Vos fûts, votre calendrier, vos tournées.",
    body: "Publiez vos disponibilités, groupez vos livraisons avec les producteurs voisins, suivez vos commandes.",
  },
  restaurateur: {
    image: "/img/cheese-wheels-aging.jpeg",
    alt: "Meules de fromage en affinage",
    kicker: "Espace restaurateur",
    title: "Une commande, une livraison, vingt producteurs.",
    body: "Retrouvez votre catalogue, vos producteurs et le créneau de la prochaine tournée en cuisine.",
  },
};

function SocialButton({ children, icon }: { children: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      title="Bientôt disponible"
      className="flex flex-1 items-center justify-center gap-2.5 rounded-[var(--radius-m)] bg-[var(--surface-card)] px-3.5 py-3 text-[14px] font-semibold text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] transition-colors hover:bg-[var(--surface-sunken)]"
    >
      {icon}
      {children}
    </button>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
      {message}
    </p>
  );
}

export default function ConnexionPage() {
  const [profile, setProfile] = useState<Profile>("producteur");
  const [view, setView] = useState<View>("login");
  const [remember, setRemember] = useState(true);

  const [loginState, submitLogin, loginPending] = useActionState(loginAction, undefined);
  const [signupState, submitSignup, signupPending] = useActionState(signupAction, undefined);

  const resto = profile === "restaurateur";
  const isSignup = view === "signup";
  const isForgot = view === "forgot";
  const role = resto ? "RESTAURANT" : "PRODUCER";

  const ctaLabel = isSignup
    ? resto
      ? "Créer mon espace restaurateur"
      : "Créer mon espace producteur"
    : resto
      ? "Accéder à mon espace restaurateur"
      : "Accéder à mon espace producteur";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      {/* ---- Colonne image (défile verticalement) ---- */}
      <div className="relative hidden overflow-hidden bg-green-900 lg:block">
        <div
          className="absolute left-0 top-0 h-[200%] w-full"
          style={{
            transform: resto ? "translateY(-50%)" : "translateY(0)",
            transition: `transform ${EASE}`,
          }}
        >
          {(["producteur", "restaurateur"] as Profile[]).map((p) => {
            const panel = PANELS[p];
            return (
              <div key={p} className="relative h-1/2 w-full">
                <Image src={panel.image} alt={panel.alt} fill className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,hsl(150_30%_8%_/_0.88),hsl(150_30%_8%_/_0.25)_55%,hsl(150_30%_8%_/_0.35))]" />
                <div className="absolute inset-0 flex flex-col justify-between p-12">
                  <div className="font-display text-[18px] tracking-[var(--tracking-tight)] text-white">
                    Matières Premières
                  </div>
                  <div className="max-w-[460px]">
                    <div className="mb-4 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-300">
                      {panel.kicker}
                    </div>
                    <div className="font-display text-[34px] leading-[var(--leading-tight)] text-white">
                      {panel.title}
                    </div>
                    <div className="mt-4 text-[15px] leading-[var(--leading-relaxed)] text-[hsl(45_30%_96%_/_0.8)]">
                      {panel.body}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Colonne formulaire ---- */}
      <div className="flex flex-col px-6 pb-10 pt-8 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">
            {isSignup ? "Vous avez déjà un compte ?" : "Pas encore des nôtres ?"}
          </span>
          <button
            type="button"
            onClick={() => setView(isSignup ? "login" : "signup")}
            className="text-[13px] font-semibold text-rose-600 transition-colors hover:text-[var(--accent-secondary-hover)] hover:underline"
          >
            {isSignup ? "Se connecter →" : "Créer un compte →"}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          {!isForgot && (
            <div>
              <div className="mb-3.5 flex items-center gap-2.5">
                <div className="h-0.5 w-7 bg-rose-600" />
                <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
                  Connexion au réseau
                </div>
              </div>
              <h1 className="font-display text-[30px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
                {isSignup ? "Rejoindre le réseau" : "Content de vous revoir"}
              </h1>
              <p className="mt-2.5 text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                Choisissez votre profil. Le reste, on s&apos;en occupe.
              </p>

              {/* Bascule Producteur / Restaurateur */}
              <div className="relative mt-7 flex rounded-[var(--radius-pill)] bg-[var(--surface-sunken)] p-1">
                <div
                  className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-[var(--radius-pill)] bg-green-700 shadow-[var(--shadow-s)]"
                  style={{
                    transform: resto ? "translateX(100%)" : "translateX(0)",
                    transition: `transform ${EASE}`,
                  }}
                />
                {(["producteur", "restaurateur"] as Profile[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProfile(p)}
                    className={cn(
                      "relative z-10 flex-1 px-2 py-2.5 text-[14px] font-bold capitalize transition-colors duration-200",
                      profile === p ? "text-white" : "text-[var(--text-secondary)]",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* ----- Formulaire connexion ----- */}
              {!isSignup && (
                <form action={submitLogin} className="mt-7 flex flex-col gap-4">
                  <Input
                    name="email"
                    label="Email professionnel"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={
                      resto ? "chef@comptoir-des-halles.fr" : "camille@ferme-trois-chenes.fr"
                    }
                  />
                  <Input
                    name="password"
                    label="Mot de passe"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                  />

                  <div className="flex items-center justify-between gap-4">
                    <Checkbox
                      label="Se souvenir de moi"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-[13px] font-semibold text-rose-600 transition-colors hover:text-[var(--accent-secondary-hover)] hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <FormError message={loginState?.error} />

                  <Button type="submit" size="lg" className="w-full" disabled={loginPending}>
                    {loginPending ? "Connexion…" : ctaLabel}
                  </Button>
                </form>
              )}

              {/* ----- Formulaire création de compte ----- */}
              {isSignup && (
                <form action={submitSignup} className="mt-7 flex flex-col gap-4">
                  <input type="hidden" name="role" value={role} />
                  <Input
                    name="companyName"
                    label={resto ? "Nom de l'établissement" : "Nom de l'exploitation"}
                    required
                    placeholder={resto ? "Le Comptoir des Halles" : "Ferme des Trois Chênes"}
                  />
                  <Input
                    name="email"
                    label="Email professionnel"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={
                      resto ? "chef@comptoir-des-halles.fr" : "camille@ferme-trois-chenes.fr"
                    }
                  />
                  <Input
                    name="password"
                    label="Mot de passe"
                    type="password"
                    autoComplete="new-password"
                    required
                    helper="8 caractères minimum."
                    placeholder="••••••••"
                  />

                  <FormError message={signupState?.error} />

                  <Button type="submit" size="lg" className="w-full" disabled={signupPending}>
                    {signupPending ? "Création…" : ctaLabel}
                  </Button>
                </form>
              )}

              <div className="my-5 flex items-center gap-3.5">
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                <span className="font-mono text-[12px] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  ou
                </span>
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              </div>
              <div className="flex gap-3">
                <SocialButton
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 12h8" />
                      <path d="M12 12L7.5 4.2" />
                      <path d="M12 12l-4.5 7.8" />
                    </svg>
                  }
                >
                  Google
                </SocialButton>
                <SocialButton
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="4" />
                      <path d="M9 15V9l3 4 3-4v6" />
                    </svg>
                  }
                >
                  Microsoft
                </SocialButton>
              </div>

              <p className="mt-6 text-[12px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
                En continuant, vous acceptez les conditions d&apos;utilisation et la charte
                producteurs de Matières Premières.
              </p>
            </div>
          )}

          {isForgot && (
            <div>
              <div className="mb-3.5 flex items-center gap-2.5">
                <div className="h-0.5 w-7 bg-rose-600" />
                <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
                  Réinitialisation
                </div>
              </div>
              <h1 className="font-display text-[30px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
                Mot de passe oublié
              </h1>
              <p className="mt-2.5 text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                Ça arrive, même aux meilleurs affineurs. Indiquez votre email professionnel, on
                vous envoie un lien de réinitialisation.
              </p>
              <div className="mt-7">
                <Input label="Email professionnel" type="email" placeholder="vous@votre-maison.fr" />
              </div>
              <div className="mt-6">
                <Button size="lg" className="w-full" disabled>
                  Envoyer le lien
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                Bientôt disponible — pour l&apos;instant, contacte-nous pour réinitialiser.
              </p>
              <button
                type="button"
                onClick={() => setView("login")}
                className="mt-5 text-[13px] font-semibold text-[var(--text-brand)] transition-colors hover:text-green-900 hover:underline"
              >
                ← Retour à la connexion
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-[12px] text-[var(--text-muted)]">
          <span>© 2026 Matières Premières</span>
          <Link href="/" className="hover:underline">
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
