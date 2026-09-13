"use server";

import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { contactSchema } from "@/lib/validation";

export type ContactActionState = { error?: string; sent?: boolean } | undefined;

/** Enregistre un message du formulaire /contact (pas d'envoi d'email pour l'instant). */
export async function sendContactMessage(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    structure: formData.get("structure"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    profile: formData.get("profile"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, structure, email, phone, profile, subject, message, consent } = parsed.data;

  await withRetry(() =>
    prisma.contactMessage.create({
      data: { name, structure, email, phone, profile, subject, message, consent },
    }),
  );

  return { sent: true };
}
