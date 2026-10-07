import type { AccountStatus, Role } from "@prisma/client";
import { BREVO_LISTS, sendEmail, upsertContact } from "@/lib/brevo";
import { accountActivatedEmail, verifyEmail, welcomeEmail } from "@/lib/emails";
import { createAuthToken, siteUrl } from "@/lib/tokens";

/**
 * Les moments clés du parcours d'un compte, côté e-mails et Brevo.
 * Toutes ces fonctions sont « best effort » : elles n'échouent jamais.
 */

type AccountInfo = { id: string; email: string; name: string; role: Role; status: AccountStatus };

const STATUT: Record<AccountStatus, string> = {
  PENDING: "EN_ATTENTE",
  ACTIVE: "ACTIF",
  SUSPENDED: "SUSPENDU",
};

function roleList(role: Role) {
  if (role === "PRODUCER") return BREVO_LISTS.producteurs;
  if (role === "CONSUMER") return BREVO_LISTS.particuliers;
  return BREVO_LISTS.acheteurs;
}

const ROLE_ATTR: Partial<Record<Role, string>> = {
  PRODUCER: "PRODUCTEUR",
  CONSUMER: "PARTICULIER",
};

async function verifyUrl(userId: string) {
  const token = await createAuthToken(userId, "VERIFY_EMAIL");
  return siteUrl(`/verifier-email?token=${token}`);
}

async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    console.error(`[onboarding] ${label}`, error);
  }
}

/** Juste après l'inscription : e-mail de bienvenue + contact ajouté dans la bonne liste. */
export async function onSignup(user: AccountInfo) {
  await Promise.all([
    safely("bienvenue", async () => {
      const mail = welcomeEmail({
        name: user.name,
        audience: user.role === "PRODUCER" ? "producer" : user.role === "CONSUMER" ? "consumer" : "buyer",
        verifyUrl: await verifyUrl(user.id),
      });
      await sendEmail({ to: user.email, toName: user.name, ...mail });
    }),
    safely("contact", () =>
      upsertContact({
        email: user.email,
        attributes: {
          ROLE: ROLE_ATTR[user.role] ?? "ACHETEUR",
          ETABLISSEMENT: user.name,
          STATUT: STATUT[user.status],
          EMAIL_CONFIRME: false,
          DATE_INSCRIPTION: new Date().toISOString().slice(0, 10),
        },
        listIds: [roleList(user.role)],
      }),
    ),
  ]);
}

export async function resendVerification(user: Pick<AccountInfo, "id" | "email" | "name">) {
  await safely("renvoi confirmation", async () => {
    const mail = verifyEmail({ verifyUrl: await verifyUrl(user.id) });
    await sendEmail({ to: user.email, toName: user.name, ...mail });
  });
}

export async function onEmailVerified(email: string) {
  await safely("contact confirmé", () =>
    upsertContact({ email, attributes: { EMAIL_CONFIRME: true } }),
  );
}

/** Changement de statut par l'admin. Première validation → e-mail + liste « comptes validés ». */
export async function onStatusChange(user: AccountInfo, previous: AccountStatus) {
  const activated = previous === "PENDING" && user.status === "ACTIVE";
  await Promise.all([
    activated &&
      safely("compte validé", async () => {
        const mail = accountActivatedEmail({
          name: user.name,
          isProducer: user.role === "PRODUCER",
          url: siteUrl("/compte"),
        });
        await sendEmail({ to: user.email, toName: user.name, ...mail });
      }),
    safely("contact statut", () =>
      upsertContact({
        email: user.email,
        attributes: { STATUT: STATUT[user.status] },
        listIds: activated ? [BREVO_LISTS.valides] : [],
      }),
    ),
  ]);
}
