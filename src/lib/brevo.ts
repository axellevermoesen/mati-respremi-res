/**
 * Petit client Brevo (ex-Sendinblue) : envoi d'e-mails transactionnels et
 * synchronisation des contacts dans des listes (base des chaînes d'onboarding,
 * configurées côté Brevo dans « Automatisations »).
 *
 * Sans BREVO_API_KEY (développement), rien n'est envoyé : l'e-mail est affiché
 * dans le terminal du serveur, liens compris, pour pouvoir tester le parcours.
 *
 * Aucune fonction ici ne lève d'erreur : un souci chez Brevo ne doit jamais
 * bloquer une inscription ou une connexion. On journalise et on continue.
 */

const API = "https://api.brevo.com/v3";

function apiKey() {
  return process.env.BREVO_API_KEY?.trim() || undefined;
}

function listId(name: string): number | undefined {
  // Tolère « #3 » tel qu'affiché dans Brevo.
  const n = Number(process.env[name]?.replace(/[^\d]/g, "") || NaN);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** Listes Brevo, renseignées dans .env.local (numéro visible dans Brevo > Contacts > Listes). */
export const BREVO_LISTS = {
  get producteurs() {
    return listId("BREVO_LIST_PRODUCTEURS");
  },
  get acheteurs() {
    return listId("BREVO_LIST_ACHETEURS");
  },
  get valides() {
    return listId("BREVO_LIST_COMPTES_VALIDES");
  },
};

async function call(path: string, body: unknown): Promise<boolean> {
  const key = apiKey();
  if (!key) return false;
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        "api-key": key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[brevo] ${path} → ${res.status}`, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[brevo] ${path} → échec réseau`, error);
    return false;
  }
}

export async function sendEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!apiKey()) {
    console.info(
      `\n[brevo:dev] E-mail non envoyé (pas de BREVO_API_KEY)\n  À : ${input.to}\n  Objet : ${input.subject}\n  Liens : ${
        [...input.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).join("\n          ") || "—"
      }\n`,
    );
    return false;
  }
  return call("/smtp/email", {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || "Matières Premières",
    },
    to: [{ email: input.to, name: input.toName }],
    subject: input.subject,
    htmlContent: input.html,
  });
}

/**
 * Crée ou met à jour un contact. Les attributs (ROLE, ETABLISSEMENT, STATUT,
 * EMAIL_CONFIRME, DATE_INSCRIPTION) doivent exister dans Brevo > Contacts >
 * Paramètres > Attributs, sinon Brevo refuse l'appel.
 */
export async function upsertContact(input: {
  email: string;
  attributes?: Record<string, string | number | boolean>;
  listIds?: (number | undefined)[];
}): Promise<boolean> {
  const listIds = (input.listIds ?? []).filter((id): id is number => id !== undefined);
  return call("/contacts", {
    email: input.email,
    attributes: input.attributes,
    listIds: listIds.length ? listIds : undefined,
    updateEnabled: true,
  });
}
