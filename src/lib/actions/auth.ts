"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { auth, signIn, signOut } from "@/auth";
import { loginSchema, signupSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

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

  const session = await auth();
  redirect(session?.user?.role === "ADMIN" ? "/admin" : "/compte");
}

/** Création de compte (producteur ou acheteur) + connexion immédiate. */
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

  try {
    const existing = await withRetry(() =>
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    );
    if (existing) {
      return { error: "Un compte existe déjà avec cette adresse email." };
    }

    if (role === "PRODUCER") {
      const slug = await uniqueProducerSlug(companyName);
      await withRetry(() =>
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
        }),
      );
    } else {
      await withRetry(() =>
        prisma.user.create({
          data: {
            email,
            passwordHash,
            role,
            name: companyName,
            status: "PENDING",
            buyerProfile: { create: { companyName, kind: role } },
          },
        }),
      );
    }
  } catch {
    return {
      error:
        "La création du compte a échoué (connexion à la base instable). Réessaie dans un instant.",
    };
  }

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
