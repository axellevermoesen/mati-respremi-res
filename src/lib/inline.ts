/**
 * Mise en forme dans un texte : **gras**, *italique*, [texte](adresse).
 * Le texte reste une simple chaîne en base ; on l'interprète à l'affichage.
 */

export type Inline =
  | string
  | { t: "b"; c: Inline[] }
  | { t: "i"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] };

/** Seuls ces types d'adresses sont acceptés (jamais de « javascript: »). */
const SAFE_URL = /^(https?:\/\/|mailto:|\/|#)/i;

export function normalizeUrl(raw: string): string {
  const url = raw.trim();
  return SAFE_URL.test(url) ? url : `https://${url}`;
}

const PATTERNS: { kind: "a" | "b" | "i"; re: RegExp }[] = [
  { kind: "a", re: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { kind: "b", re: /\*\*(.+?)\*\*/ },
  { kind: "i", re: /\*(.+?)\*/ },
];

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    let best: { kind: "a" | "b" | "i"; m: RegExpExecArray } | null = null;
    for (const p of PATTERNS) {
      const m = p.re.exec(rest);
      if (m && (!best || m.index < best.m.index)) best = { kind: p.kind, m };
    }
    if (!best) {
      out.push(rest);
      break;
    }
    const { kind, m } = best;
    if (m.index > 0) out.push(rest.slice(0, m.index));
    if (kind === "a") {
      const children = parseInline(m[1]);
      if (SAFE_URL.test(m[2])) out.push({ t: "a", href: m[2], c: children });
      else out.push(...children);
    } else {
      out.push({ t: kind, c: parseInline(m[1]) });
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

/** Le texte sans les signes de mise en forme (pour compter les mots, etc.). */
export function stripInline(src: string): string {
  const walk = (nodes: Inline[]): string =>
    nodes.map((n) => (typeof n === "string" ? n : walk(n.c))).join("");
  return walk(parseInline(src));
}
