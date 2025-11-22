import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/index.js";

// Singleton PrismaClient instance
let prisma: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    // Create the Prisma adapter with SQLite database URL
    const adapter = new PrismaBetterSqlite3({
      url: "file:./data/moderation.db",
    });

    // Initialize Prisma Client with the adapter
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
};

// Export a default instance for convenience
export const db = getPrismaClient();
