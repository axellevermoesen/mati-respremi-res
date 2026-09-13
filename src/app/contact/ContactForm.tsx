"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { sendContactMessage } from "@/lib/actions/contact";

const PROFILES = [
  { value: "producteur", label: "Producteur / productrice" },
  { value: "restaurateur", label: "Restaurateur / restauratrice" },
  { value: "autre", label: "Autre (presse, partenaire, curieux)" },
];

const SUBJECTS = [
  { value: "commande", label: "Une commande en cours" },
  { value: "livraison", label: "Une livraison ou une tournée" },
  { value: "rejoindre", label: "Rejoindre la plateforme" },
  { value: "facturation", label: "Facturation" },
  { value: "autre", label: "Autre chose" },
];

export function ContactForm() {
  const [state, submit, pending] = useActionState(sendContactMessage, undefined);

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-10 shadow-[var(--shadow-m)] sm:p-12">
        <h2 className="font-display text-[26px] text-green-900">
          C&apos;est parti. On vous répond très vite.
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Votre message est arrivé. Un membre de l&apos;équipe reprend contact sous 24 h
          ouvrées — et il aura lu votre message en entier, promis.
        </p>
        <div>
          <Button href="/contact" variant="secondary">
            Écrire un autre message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={submit}
      className="rounded-[var(--radius-l)] bg-[var(--surface-card)] p-8 shadow-[var(--shadow-m)] sm:p-10"
    >
      <h2 className="font-display text-[26px] text-green-900">Écrivez-nous</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-muted)]">
        Plus vous êtes précis, plus notre réponse le sera.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input name="name" label="Nom et prénom" placeholder="Camille Dubois" required />
        <Input name="structure" label="Structure" placeholder="Ferme des Hauts Prés" />
        <Input
          name="email"
          type="email"
          label="Email professionnel"
          placeholder="camille@hautspres.fr"
          required
        />
        <Input
          name="phone"
          type="tel"
          label="Téléphone"
          placeholder="06 12 34 56 78"
          helper="Facultatif"
        />
        <div className="sm:col-span-2">
          <Select name="profile" label="Vous êtes" placeholder="Choisir" options={PROFILES} />
        </div>
        <div className="sm:col-span-2">
          <Select name="subject" label="Votre sujet" placeholder="Choisir" options={SUBJECTS} />
        </div>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
          Votre message
        </span>
        <textarea
          name="message"
          rows={6}
          required
          minLength={10}
          placeholder="Dites-nous ce que vous produisez, où, et ce que vous cherchez."
          className="resize-y rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 py-3 text-[15px] leading-relaxed text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none transition-shadow duration-150 placeholder:text-[var(--text-muted)] focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
        />
      </label>

      <div className="mt-5">
        <Checkbox name="consent" label="J'accepte d'être recontacté·e par l'équipe Matières Premières." />
      </div>

      {state?.error && (
        <p className="mt-5 rounded-[var(--radius-s)] bg-[hsl(9_49%_48%_/_0.10)] px-3 py-2 text-[13px] font-medium text-[var(--state-danger)]">
          {state.error}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer le message"}
        </Button>
        <span className="text-[13px] text-[var(--text-muted)]">Réponse sous 24 h ouvrées.</span>
      </div>
    </form>
  );
}
