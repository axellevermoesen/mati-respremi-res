"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { completeBuyerProfile } from "@/lib/actions/profile";

const EASE = "520ms cubic-bezier(.4,0,.2,1)";

const ETABLISSEMENT_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "epicerie", label: "Épicerie / revendeur" },
  { value: "autre", label: "Autre (traiteur, cantine…)" },
];

export function AcheteurForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [notifySecond, setNotifySecond] = useState(true);
  const [terms, setTerms] = useState(false);
  const [state, submit, pending] = useActionState(completeBuyerProfile, undefined);

  const step2 = step === 2;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-page)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-8 py-5">
        <Link
          href="/"
          className="font-display text-[18px] tracking-[var(--tracking-tight)] text-green-900"
        >
          Matières Premières
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-[var(--text-muted)]">Déjà tout rempli ?</span>
          <Link
            href="/compte"
            className="text-[13px] font-semibold text-rose-600 transition-colors hover:text-[var(--accent-secondary-hover)] hover:underline"
          >
            Mon compte →
          </Link>
        </div>
      </div>

      <form
        action={submit}
        className="flex flex-1 justify-center px-6 pb-[72px] pt-14"
      >
        <div className="flex w-full max-w-[620px] flex-col rounded-[var(--radius-xl)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)] sm:p-12 sm:px-14">
          <div className="mb-3.5 flex items-center gap-2.5">
            <div className="h-0.5 w-7 bg-rose-600" />
            <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
              Inscription acheteur
            </div>
          </div>

          <h1 className="font-display text-[30px] leading-[var(--leading-tight)] text-[var(--text-primary)]">
            {step2 ? "Qui réceptionne en cuisine ?" : "Votre établissement"}
          </h1>
          <p className="mt-2.5 text-[15px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
            {step2
              ? "Un second contact, pour que personne ne coure après le camion."
              : "Le dirigeant, la structure, l'adresse de livraison. Rien de plus."}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-sand-200">
              <div
                className="h-full rounded-[var(--radius-pill)] bg-green-700"
                style={{ width: step2 ? "100%" : "50%", transition: `width ${EASE}` }}
              />
            </div>
            <div className="whitespace-nowrap font-display text-[13px] text-[var(--text-muted)]">
              Étape {step} / 2
            </div>
          </div>

          <div className="mt-7 overflow-hidden">
            <div
              className="flex w-[200%] items-start"
              style={{
                transform: step2 ? "translateX(-50%)" : "translateX(0)",
                transition: `transform ${EASE}`,
              }}
            >
              {/* Pane 1 */}
              <div className="flex w-1/2 shrink-0 flex-col gap-[18px] pr-1">
                <div className="flex flex-col gap-3.5">
                  <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    Le dirigeant
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <Input name="dirigeantPrenom" label="Prénom" placeholder="Camille" />
                    <Input name="dirigeantNom" label="Nom" placeholder="Roussel" />
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <Input
                      name="dirigeantTelephone"
                      label="Téléphone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                    />
                    <Input
                      name="dirigeantEmail"
                      label="Email professionnel"
                      type="email"
                      placeholder="camille@comptoir-des-halles.fr"
                    />
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)]" />

                <div className="flex flex-col gap-3.5">
                  <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    L&apos;établissement
                  </div>
                  <Input
                    name="structureNom"
                    label="Nom de la structure"
                    placeholder="Le Comptoir des Halles"
                  />
                  <Select
                    name="typeEtablissement"
                    label="Type d'établissement"
                    placeholder="Choisir"
                    options={ETABLISSEMENT_TYPES}
                  />
                  <Input
                    name="siret"
                    label="N° SIRET"
                    placeholder="123 456 789 00012"
                    helper="14 chiffres — on vérifie l'immatriculation avant d'ouvrir le catalogue."
                  />
                  <Input
                    name="adresse"
                    label="Adresse de livraison"
                    placeholder="12 rue des Halles"
                  />
                  <div className="grid grid-cols-[1fr_1.6fr] gap-3.5">
                    <Input name="codePostal" label="Code postal" placeholder="59000" />
                    <Input name="ville" label="Ville" placeholder="Lille" />
                  </div>
                </div>
              </div>

              {/* Pane 2 */}
              <div className="flex w-1/2 shrink-0 flex-col gap-[18px] pl-1">
                <div className="flex flex-col gap-3.5">
                  <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                    Deuxième contact
                  </div>
                  <p className="text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                    La personne qui réceptionne les tournées quand vous êtes au piano : chef,
                    second, gérant de salle.
                  </p>
                  <div className="grid grid-cols-2 gap-3.5">
                    <Input name="contact2Prenom" label="Prénom" placeholder="Yanis" />
                    <Input name="contact2Nom" label="Nom" placeholder="Baradji" />
                  </div>
                  <Input
                    name="contact2Fonction"
                    label="Fonction dans l'établissement"
                    placeholder="Chef de cuisine"
                  />
                  <div className="grid grid-cols-2 gap-3.5">
                    <Input
                      name="contact2Telephone"
                      label="Téléphone"
                      type="tel"
                      placeholder="06 98 76 54 32"
                    />
                    <Input
                      name="contact2Email"
                      label="Email"
                      type="email"
                      placeholder="yanis@comptoir-des-halles.fr"
                    />
                  </div>
                </div>

                <div className="h-px bg-[var(--border-subtle)]" />

                <div className="flex flex-col gap-3">
                  <Checkbox
                    label="Ce contact reçoit aussi les confirmations de livraison"
                    checked={notifySecond}
                    onChange={(e) => setNotifySecond(e.target.checked)}
                  />
                  <Checkbox
                    label="J'accepte les conditions et la charte producteurs"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {state?.error && (
            <p className="mt-5 rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
              {state.error}
            </p>
          )}

          <div className="mt-7 flex items-center gap-3">
            {step2 && (
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)}>
                Retour
              </Button>
            )}
            {step2 ? (
              <Button
                key="submit-btn"
                type="submit"
                size="lg"
                className="flex-1"
                disabled={pending}
              >
                {pending ? "Enregistrement…" : "Créer mon compte"}
              </Button>
            ) : (
              <Button
                key="next-btn"
                type="button"
                size="lg"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                Continuer
              </Button>
            )}
          </div>

          <p className="mt-5 text-[12px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
            {step2
              ? "Votre demande est vérifiée sous 24 h ouvrées. On vous écrit dès que le catalogue de votre secteur est ouvert."
              : "Le SIRET nous sert à vérifier que vous êtes bien un professionnel — et à vous rattacher à la bonne tournée."}
          </p>
        </div>
      </form>

      <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-8 py-5 text-[12px] text-[var(--text-muted)]">
        <span>© 2026 Matières Premières</span>
        <Link href="/contact" className="hover:underline">
          Besoin d&apos;aide ?
        </Link>
      </div>
    </div>
  );
}
