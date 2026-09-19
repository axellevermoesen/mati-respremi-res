/**
 * Types et petits calculs partagés pour le contenu éditorial (blog + podcast).
 * Le contenu lui-même vit en base (voir Article/Episode/Page dans prisma/schema.prisma) ;
 * ce fichier ne garde que ce qui est réutilisé un peu partout.
 */

import { stripInline } from "@/lib/inline";

export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string; id: string }
  | { t: "h3"; text: string; id: string }
  | { t: "quote"; text: string; cite?: string }
  | { t: "list"; items: string[] }
  | { t: "callout"; kicker: string; items: string[] }
  | { t: "img"; src: string; alt: string; caption?: string };

export function blocksWordCount(body: Block[]): number {
  return body
    .map((b) => {
      switch (b.t) {
        case "p":
        case "h2":
        case "h3":
        case "quote":
          return stripInline(b.text);
        case "list":
        case "callout":
          return b.items.map(stripInline).join(" ");
        case "img":
          return b.caption ?? "";
      }
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Temps de lecture estimé (~200 mots/minute), minimum 1 minute. */
export function readingMinutes(body: Block[]): number {
  return Math.max(1, Math.round(blocksWordCount(body) / 200));
}

/** Formats d'affichage d'une durée d'épisode à partir de sa longueur en secondes. */
export function episodeDuration(totalSeconds: number): { durationLabel: string; clock: string } {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return {
    durationLabel: `${Math.round(totalSeconds / 60)} min`,
    clock: `${m}:${String(s).padStart(2, "0")}`,
  };
}

export function frDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input + "T00:00:00") : input;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
