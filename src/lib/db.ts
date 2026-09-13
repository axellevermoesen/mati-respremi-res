import { Prisma } from "@prisma/client";

// P1xxx = connexion ; P2024 = pool timeout ; P2028 = transaction expirée
const RETRYABLE_CODES = ["P1000", "P1001", "P1002", "P1008", "P1017", "P2024", "P2028"];

/**
 * Réessaie une opération base de données quand la connexion au pooler Supabase
 * échoue de façon transitoire (fréquent sur l'offre gratuite : le TCP passe mais
 * la poignée de main Postgres échoue par intermittence). Une fois connectée, la
 * connexion reste stable — quelques tentatives suffisent.
 */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          RETRYABLE_CODES.includes(error.code));
      if (!retryable || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  throw lastError;
}
