import { PrismaClient } from "../../generated/prisma/index.js";

// Singleton PrismaClient instance
let prisma: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Export a default instance for convenience
export const db = getPrismaClient();
