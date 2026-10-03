import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { findValidToken } from "@/lib/tokens";
import { onEmailVerified } from "@/lib/onboarding";

/**
 * Lien « Confirmer mon adresse » reçu par e-mail. Le jeton reste valable jusqu'à
 * expiration (pas à usage unique) : certaines messageries « visitent » les liens
 * pour les analyser, et le vrai clic de l'utilisateur doit quand même marcher.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const row = await findValidToken(token, "VERIFY_EMAIL");

  const target = new URL("/compte", request.nextUrl.origin);
  if (!row) {
    target.searchParams.set("email", "lien-expire");
    return NextResponse.redirect(target);
  }

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: row.userId },
      select: { email: true, emailVerifiedAt: true },
    }),
  );
  if (user && !user.emailVerifiedAt) {
    await withRetry(() =>
      prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    );
    await onEmailVerified(user.email);
  }

  target.searchParams.set("email", "confirme");
  return NextResponse.redirect(target);
}
