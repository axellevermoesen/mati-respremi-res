import { PrismaClient } from "@prisma/client";

// Une seule instance de PrismaClient réutilisée (évite d'ouvrir trop de
// connexions pendant le rechargement à chaud en développement).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
