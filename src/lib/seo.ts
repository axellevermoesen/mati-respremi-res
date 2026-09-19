import { blocksWordCount, type Block } from "@/lib/content";

export type SeoCheck = { label: string; ok: boolean };
export type SeoReport = { score: number; checks: SeoCheck[] };

/** Score de référencement sur 100, avec le détail des points contrôlés (esprit Yoast). */
export function computeSeoScore(input: {
  title: string;
  metaTitle: string;
  metaDescription: string;
  body: Block[];
}): SeoReport {
  const { title, metaTitle, metaDescription, body } = input;
  const h2Count = body.filter((b) => b.t === "h2").length;
  const words = blocksWordCount(body);

  const checks: SeoCheck[] = [
    { label: "Titre (H1) rempli", ok: title.trim().length > 0 },
    {
      label: "Meta title entre 30 et 60 signes",
      ok: metaTitle.trim().length >= 30 && metaTitle.trim().length <= 60,
    },
    {
      label: "Meta description entre 50 et 160 signes",
      ok: metaDescription.trim().length >= 50 && metaDescription.trim().length <= 160,
    },
    { label: "Au moins un sous-titre (H2) pour structurer", ok: h2Count >= 1 },
    { label: "Au moins 100 mots dans le corps", ok: words >= 100 },
  ];

  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}
