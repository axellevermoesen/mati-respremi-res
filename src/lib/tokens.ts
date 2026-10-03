import { createHash, randomBytes } from "node:crypto";
import type { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";

const TTL_MS: Record<AuthTokenType, number> = {
  VERIFY_EMAIL: 7 * 24 * 60 * 60 * 1000, // 7 jours
  RESET_PASSWORD: 60 * 60 * 1000, // 1 heure
};

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Adresse publique du site, pour construire les liens des e-mails. */
export function siteUrl(path: string) {
  const base = (process.env.AUTH_URL || "http://localhost:3100").replace(/\/$/, "");
  return `${base}${path}`;
}

/** Crée un nouveau jeton (et invalide les précédents du même type). Renvoie le jeton en clair. */
export async function createAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await withRetry(() => prisma.authToken.deleteMany({ where: { userId, type } }));
  await withRetry(() =>
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + TTL_MS[type]),
      },
    }),
  );
  return token;
}

/**
 * Retrouve le jeton s'il est valide (bon type, pas expiré, pas déjà utilisé).
 * Ne le consomme pas : voir `markTokenUsed`.
 */
export async function findValidToken(token: string, type: AuthTokenType) {
  if (!token) return null;
  const row = await withRetry(() =>
    prisma.authToken.findUnique({ where: { tokenHash: hash(token) } }),
  );
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}

export async function markTokenUsed(id: string) {
  await withRetry(() => prisma.authToken.update({ where: { id }, data: { usedAt: new Date() } }));
}
