"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/slug";
import { onSignup, resendVerification } from "@/lib/onboarding";
import { sendEmail } from "@/lib/brevo";
import { resetPasswordEmail } from "@/lib/emails";
import { createAuthToken, findValidToken, markTokenUsed, siteUrl } from "@/lib/tokens";

export type ActionState = { error?: string } | undefined;

/** Connexion email + mot de passe. Redirige vers /admin (administrateur) ou /compte. */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }

  // Le rôle se lit en base : juste après signIn, auth() ne voit pas encore le
  // nouveau cookie de session dans cette même requête.
  const user = await withRetry(() =>
    prisma.user.findUnique({ where: { email: parsed.data.email }, select: { role: true } }),
  );
  redirect(user?.role === "ADMIN" ? "/admin" : "/compte");
}

/** Création de compte (producteur, acheteur pro ou particulier) + connexion immédiate. */
export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    role: formData.get("role"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { role, companyName, email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  let created: { id: string; status: "PENDING" | "ACTIVE" | "SUSPENDED" };
  try {
    const existing = await withRetry(() =>
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    );
    if (existing) {
      return { error: "Un compte existe déjà avec cette adresse email." };
    }

    if (role === "PRODUCER") {
      const slug = await uniqueProducerSlug(companyName);
      created = await withRetry(() =>
        prisma.user.create({
          data: {
            email,
            passwordHash,
            role: "PRODUCER",
            name: companyName,
            status: "PENDING",
            producerProfile: {
              create: {
                slug,
                farmName: companyName,
                description: "",
                practices: "",
                region: "",
              },
            },
          },
          select: { id: true, status: true },
        }),
      );
    } else if (role === "CONSUMER") {
      // Particulier : rien à vérifier côté admin, le compte est actif tout de suite.
      const [firstName, ...rest] = companyName.split(/\s+/);
      created = await withRetry(() =>
        prisma.user.create({
          data: {
            email,
            passwordHash,
            role: "CONSUMER",
            name: companyName,
            status: "ACTIVE",
            consumerProfile: { create: { firstName, lastName: rest.join(" ") || null } },
          },
          select: { id: true, status: true },
        }),
      );
    } else {
      created = await withRetry(() =>
        prisma.user.create({
          data: {
            email,
            passwordHash,
            role,
            name: companyName,
            status: "PENDING",
            buyerProfile: { create: { companyName, kind: role } },
          },
          select: { id: true, status: true },
        }),
      );
    }
  } catch {
    return {
      error:
        "La création du compte a échoué (connexion à la base instable). Réessaie dans un instant.",
    };
  }

  // E-mail de bienvenue (avec lien de confirmation) + contact Brevo.
  await onSignup({ id: created.id, email, name: companyName, role, status: created.status });

  try {
    await signIn("credentials", { email, password, redirectTo: "/compte" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé, mais la connexion a échoué. Essaie de te connecter." };
    }
    throw error;
  }
  return undefined;
}

export type ForgotState = { error?: string; sent?: boolean } | undefined;

/**
 * « Mot de passe oublié » : envoie un lien de réinitialisation. Répond toujours
 * « envoyé », que le compte existe ou non (on ne révèle pas qui est inscrit).
 */
export async function requestPasswordResetAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Adresse email invalide." };
  }

  try {
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true, status: true, passwordHash: true },
      }),
    );
    if (user?.passwordHash && user.status !== "SUSPENDED") {
      const token = await createAuthToken(user.id, "RESET_PASSWORD");
      const mail = resetPasswordEmail({
        resetUrl: siteUrl(`/reinitialiser-mot-de-passe?token=${token}`),
      });
      await sendEmail({ to: user.email, ...mail });
    }
  } catch (error) {
    console.error("[auth] mot de passe oublié", error);
    return { error: "Envoi impossible pour le moment. Réessaie dans un instant." };
  }

  return { sent: true };
}

export type ResetState = { error?: string; done?: boolean } | undefined;

/** Enregistre le nouveau mot de passe choisi via le lien reçu par e-mail. */
export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const row = await findValidToken(parsed.data.token, "RESET_PASSWORD");
  if (!row) {
    return { error: "Ce lien a expiré ou a déjà servi. Refais une demande depuis la page de connexion." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await markTokenUsed(row.id);
  // Cliquer le lien prouve aussi que l'adresse e-mail est la bonne.
  await withRetry(() =>
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash, emailVerifiedAt: new Date() },
    }),
  );
  return { done: true };
}

/** Bouton « Renvoyer le lien » du bandeau « confirme ton adresse ». */
export async function resendVerificationAction(): Promise<{ sent?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Connecte-toi d'abord." };

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    }),
  );
  if (!user) return { error: "Compte introuvable." };
  if (user.emailVerifiedAt) return { sent: true };

  await resendVerification({ id: user.id, email: user.email, name: user.name ?? "" });
  return { sent: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

async function uniqueProducerSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 1;
  while (
    await withRetry(() =>
      prisma.producerProfile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      }),
    )
  ) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
