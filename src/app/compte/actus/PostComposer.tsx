"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PostKind } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { createPost } from "@/lib/actions/posts";
import { uploadProducerImage } from "@/lib/actions/upload";
import { POST_KIND_HINT, POST_KIND_LABEL } from "@/lib/posts";
import { cn } from "@/lib/cn";

const KINDS: PostKind[] = ["TEXT", "PHOTO", "PRODUCT", "EVENT", "RESTAURANT"];

const EMPTY = {
  title: "",
  body: "",
  bodyPro: "",
  eventDate: "",
  eventTime: "",
  eventPlace: "",
  productName: "",
  productNote: "",
  restaurantName: "",
  restaurantPlace: "",
};

/** Formulaire « Publier une actu » de l'espace producteur. */
export function PostComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<PostKind>("TEXT");
  const [f, setF] = useState(EMPTY);
  const [forPros, setForPros] = useState(true);
  const [forPublic, setForPublic] = useState(true);
  const [splitText, setSplitText] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [saving, startSave] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const both = forPros && forPublic;
  const showProText = both && splitText;
  const mainLabel = showProText
    ? "Message pour les particuliers"
    : forPros && !forPublic
      ? "Message pour les pros"
      : "Message";

  const pickFile = (file: File) => {
    setMsg(undefined);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", "post");
    startUpload(async () => {
      const res = await uploadProducerImage(fd);
      if ("error" in res) setMsg({ tone: "err", text: res.error });
      else setImageUrl(res.url);
    });
  };

  const submit = () => {
    setMsg(undefined);
    startSave(async () => {
      const res = await createPost({
        kind,
        ...f,
        bodyPro: showProText ? f.bodyPro : "",
        imageUrl: imageUrl ?? "",
        forPros,
        forPublic,
      });
      if ("error" in res) {
        setMsg({ tone: "err", text: res.error });
        return;
      }
      setF(EMPTY);
      setImageUrl(null);
      setSplitText(false);
      setMsg({
        tone: "ok",
        text: both
          ? "C'est publié, pour vos clients pros et vos abonnés particuliers."
          : forPros
            ? "C'est publié pour vos clients pros."
            : "C'est publié pour vos abonnés particuliers.",
      });
      router.refresh();
    });
  };

  return (
    <section className="mt-8 rounded-[var(--radius-l)] bg-[var(--surface-card)] px-6 py-6 shadow-[var(--shadow-m)] sm:px-7">
      <h2 className="font-display text-[18px] text-[var(--text-primary)]">Publier une actu</h2>

      {/* Type d'actu */}
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Type d'actu">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              kind === k
                ? "bg-green-900 text-white"
                : "bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-sand-200",
            )}
          >
            {POST_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-[var(--text-muted)]">{POST_KIND_HINT[kind]}</p>

      {/* Public */}
      <fieldset className="mt-6">
        <legend className="mp-lab">Qui reçoit cette actu ?</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <AudienceCard
            checked={forPros}
            onToggle={() => setForPros((v) => !v)}
            title="Les pros (BtoB)"
            text="Restaurateurs et revendeurs : vos clients et ceux qui vous suivent. Visible dans leur espace et sur votre page pro."
          />
          <AudienceCard
            checked={forPublic}
            onToggle={() => setForPublic((v) => !v)}
            title="Les particuliers (BtoC)"
            text="Vos abonnés : dans leur fil, dans le mail du dimanche, et sur votre page publique."
          />
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="mp-lab">Titre</span>
          <input
            className="mp-in"
            value={f.title}
            onChange={set("title")}
            maxLength={140}
            placeholder="Les premières meules de 24 mois sont prêtes"
          />
        </label>

        {both && (
          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={splitText}
              onChange={(e) => setSplitText(e.target.checked)}
              className="h-4 w-4 accent-[var(--green-700)]"
            />
            Écrire un message différent pour les pros
          </label>
        )}

        <div className={cn("grid gap-4", showProText && "md:grid-cols-2")}>
          <label className="flex flex-col gap-1.5">
            <span className="mp-lab">{mainLabel}</span>
            <textarea
              className="mp-in"
              rows={5}
              maxLength={2000}
              value={f.body}
              onChange={set("body")}
              placeholder={
                forPros && !forPublic
                  ? "Disponible dès mardi sur la tournée, 30 meules. Prix pro inchangé."
                  : "Deux ans de cave, retournées à la main chaque semaine. Notes de noisette grillée."
              }
            />
          </label>
          {showProText && (
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Message pour les pros</span>
              <textarea
                className="mp-in"
                rows={5}
                maxLength={2000}
                value={f.bodyPro}
                onChange={set("bodyPro")}
                placeholder="Quantités, prix, jour de livraison, conditionnement…"
              />
            </label>
          )}
        </div>

        {/* Champs selon le type */}
        {kind === "EVENT" && (
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Date</span>
              <input type="date" className="mp-in" value={f.eventDate} onChange={set("eventDate")} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Horaires</span>
              <input
                className="mp-in"
                value={f.eventTime}
                onChange={set("eventTime")}
                placeholder="10 h – 18 h"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="mp-lab">Lieu</span>
              <input
                className="mp-in"
                value={f.eventPlace}
                onChange={set("eventPlace")}
                placeholder="Domaine Lescure, route de Cordes, Gaillac"
              />
            </label>
          </div>
        )}
        {kind === "PRODUCT" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Produit</span>
              <input
                className="mp-in"
                value={f.productName}
                onChange={set("productName")}
                placeholder="Comté 24 mois"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Précision</span>
              <input
                className="mp-in"
                value={f.productNote}
                onChange={set("productNote")}
                placeholder="Disponible chez les restaurateurs du réseau"
              />
            </label>
          </div>
        )}
        {kind === "RESTAURANT" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Restaurant</span>
              <input
                className="mp-in"
                value={f.restaurantName}
                onChange={set("restaurantName")}
                placeholder="Le Comptoir des Halles"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="mp-lab">Où / quel plat</span>
              <input
                className="mp-in"
                value={f.restaurantPlace}
                onChange={set("restaurantPlace")}
                placeholder="Lyon 2e · velouté du jour"
              />
            </label>
          </div>
        )}

        {/* Photo */}
        <div className="flex flex-col gap-1.5">
          <span className="mp-lab">Photo {kind === "PHOTO" ? "" : "(facultatif)"}</span>
          {imageUrl ? (
            <div className="flex items-center gap-4">
              <span className="relative h-[72px] w-[128px] overflow-hidden rounded-[var(--radius-m)] bg-[var(--surface-sunken)]">
                <Image src={imageUrl} alt="" fill sizes="128px" className="object-cover" unoptimized />
              </span>
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-[13px] font-semibold text-[var(--text-brand)] hover:underline"
              >
                Retirer la photo
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mp-add"
              >
                {uploading ? "Envoi de la photo…" : "+ Ajouter une photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) pickFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="button" onClick={submit} disabled={saving || uploading}>
          {saving ? "Publication…" : "Publier"}
        </Button>
        {msg && (
          <span
            role="status"
            className={cn(
              "text-[14px] font-semibold",
              msg.tone === "ok" ? "text-green-700" : "text-[var(--state-danger)]",
            )}
          >
            {msg.text}
          </span>
        )}
      </div>
    </section>
  );
}

function AudienceCard({
  checked,
  onToggle,
  title,
  text,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={title}
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-m)] px-4 py-3.5 text-left transition-colors",
        checked
          ? "bg-[var(--rose-100)] shadow-[inset_0_0_0_1.5px_var(--green-900)]"
          : "bg-[var(--surface-sunken)] shadow-[inset_0_0_0_1px_var(--border-subtle)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] text-[12px] font-bold text-white",
          checked ? "bg-green-900" : "bg-[var(--surface-card)] shadow-[inset_0_0_0_1.5px_var(--border-default)]",
        )}
      >
        {checked ? "✓" : ""}
      </span>
      <span>
        <span className="block text-[14px] font-bold text-[var(--text-primary)]">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
          {text}
        </span>
      </span>
    </button>
  );
}
