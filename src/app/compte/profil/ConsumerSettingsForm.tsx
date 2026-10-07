"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  changeConsumerPassword,
  deleteConsumerAccount,
  saveConsumerSettings,
} from "@/lib/actions/consumer";
import { RADIUS_OPTIONS } from "@/lib/validation";
import { plural } from "@/lib/posts";

type Settings = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  radius: string;
  sundayMail: boolean;
};

const CARD = "rounded-[var(--radius-l)] bg-[var(--surface-card)] px-6 py-6 shadow-[var(--shadow-m)] sm:px-7";

export function ConsumerSettingsForm({
  email,
  initial,
  followed,
  inMail,
}: {
  email: string;
  initial: Settings;
  followed: number;
  inMail: number;
}) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState<string>();
  const [error, setError] = useState<string>();

  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwBusy, startPw] = useTransition();
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string }>();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const field = (k: keyof Settings) => (e: { target: { value: string } }) => {
    setSaved(undefined);
    setS((x) => ({ ...x, [k]: e.target.value }));
  };

  const save = () =>
    startSave(async () => {
      setError(undefined);
      const res = await saveConsumerSettings(s);
      if ("error" in res) setError(res.error);
      else {
        setSaved("C'est noté. Vos producteurs n'en sauront rien.");
        router.refresh();
      }
    });

  return (
    <div className="mt-7 flex flex-col gap-5">
      <section className={CARD}>
        <h2 className="font-display text-[18px] text-[var(--text-primary)]">Informations personnelles</h2>
        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <Input label="Prénom" value={s.firstName} onChange={field("firstName")} autoComplete="given-name" />
          <Input label="Nom" value={s.lastName} onChange={field("lastName")} autoComplete="family-name" />
          <Input label="Email" type="email" value={email} readOnly disabled helper="Pour changer d'adresse, écrivez-nous." />
          <Input
            label="Téléphone (facultatif)"
            type="tel"
            value={s.phone}
            onChange={field("phone")}
            placeholder="06 12 34 56 78"
            autoComplete="tel"
          />
        </div>
      </section>

      <section className={CARD}>
        <h2 className="font-display text-[18px] text-[var(--text-primary)]">Ville et zone</h2>
        <p className="mt-1.5 text-[14px] text-[var(--text-muted)]">
          Pour vous suggérer les producteurs qui livrent autour de chez vous.
        </p>
        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <Input
            label="Ville ou code postal"
            value={s.city}
            onChange={field("city")}
            placeholder="Lyon 4e (69004)"
            autoComplete="address-level2"
          />
          <Select
            label="Rayon"
            value={s.radius}
            onChange={field("radius")}
            options={RADIUS_OPTIONS.map((r) => ({ value: r, label: r }))}
          />
        </div>
      </section>

      <section className={CARD}>
        <h2 className="font-display text-[18px] text-[var(--text-primary)]">Mail du dimanche</h2>
        <p className="mt-1.5 text-[14px] text-[var(--text-muted)] [text-wrap:pretty]">
          Chaque dimanche matin, les actus de la semaine des producteurs que vous avez choisis. Pas
          d&apos;actu, pas de mail.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex items-center gap-3 text-[14px] font-semibold text-[var(--text-secondary)]">
            <Switch
              checked={s.sundayMail}
              label="Recevoir le mail du dimanche"
              onChange={(next) => {
                setSaved(undefined);
                setS((x) => ({ ...x, sundayMail: next }));
              }}
            />
            Recevoir le mail du dimanche
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
            <span className="text-[14px] text-[var(--text-secondary)]">
              {s.sundayMail
                ? `${plural(inMail, "producteur inclus", "producteurs inclus")} sur ${followed} suivi${followed > 1 ? "s" : ""}.`
                : "Désactivé. Vos actus restent dans votre fil."}
            </span>
            <Link href="/compte?onglet=gerer" className="whitespace-nowrap text-[13px] font-bold text-green-900 hover:underline">
              Modifier la liste →
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {saved && <span role="status" className="text-[14px] font-semibold text-green-700">{saved}</span>}
        {error && <span role="alert" className="text-[14px] font-semibold text-[var(--state-danger)]">{error}</span>}
      </div>

      <section className={CARD}>
        <h2 className="font-display text-[18px] text-[var(--text-primary)]">Mot de passe</h2>
        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <Input
            label="Mot de passe actuel"
            type="password"
            autoComplete="current-password"
            value={pw.current}
            onChange={(e) => setPw((x) => ({ ...x, current: e.target.value }))}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            helper="8 caractères minimum"
            value={pw.next}
            onChange={(e) => setPw((x) => ({ ...x, next: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pwBusy || !pw.current || !pw.next}
            onClick={() =>
              startPw(async () => {
                setPwMsg(undefined);
                const res = await changeConsumerPassword(pw);
                if ("error" in res) setPwMsg({ ok: false, text: res.error });
                else {
                  setPw({ current: "", next: "" });
                  setPwMsg({ ok: true, text: "Mot de passe changé." });
                }
              })
            }
          >
            {pwBusy ? "…" : "Changer le mot de passe"}
          </Button>
          {pwMsg && (
            <span className={`text-[14px] font-semibold ${pwMsg.ok ? "text-green-700" : "text-[var(--state-danger)]"}`}>
              {pwMsg.text}
            </span>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[var(--radius-l)] px-6 py-6 shadow-[inset_0_0_0_1px_var(--border-subtle)] sm:px-7">
        <h2 className="font-display text-[18px] text-[var(--text-primary)]">Supprimer mon compte</h2>
        <p className="mt-1.5 text-[14px] text-[var(--text-muted)] [text-wrap:pretty]">
          Vos abonnements et préférences seront effacés. Vos producteurs, eux, continueront de bien
          faire leur travail.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!confirmDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-terracotta-600 shadow-[inset_0_0_0_1px_var(--terracotta-600)]"
              onClick={() => setConfirmDelete(true)}
            >
              Supprimer mon compte
            </Button>
          ) : (
            <>
              <span className="text-[14px] text-[var(--text-secondary)]">C&apos;est définitif. On y va ?</span>
              <Button
                type="button"
                size="sm"
                className="bg-terracotta-600 hover:bg-terracotta-600/90"
                disabled={deleting}
                onClick={() => startDelete(async () => void (await deleteConsumerAccount()))}
              >
                {deleting ? "Suppression…" : "Oui, supprimer"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
