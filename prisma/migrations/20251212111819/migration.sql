/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Action" (
    "actionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "moderatorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" INTEGER NOT NULL,
    "expiresAt" INTEGER,
    "revertingActionId" INTEGER,
    CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discordUserId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Action_moderatorUserId_fkey" FOREIGN KEY ("moderatorUserId") REFERENCES "User" ("discordUserId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Action_revertingActionId_fkey" FOREIGN KEY ("revertingActionId") REFERENCES "Action" ("actionId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Action" ("actionId", "createdAt", "expiresAt", "moderatorUserId", "note", "reason", "revertingActionId", "status", "type", "userId") SELECT "actionId", "createdAt", "expiresAt", "moderatorUserId", "note", "reason", "revertingActionId", "status", "type", "userId" FROM "Action";
DROP TABLE "Action";
ALTER TABLE "new_Action" RENAME TO "Action";
CREATE UNIQUE INDEX "Action_revertingActionId_key" ON "Action"("revertingActionId");
CREATE TABLE "new_User" (
    "discordUserId" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'MEMBER'
);
INSERT INTO "new_User" ("discordUserId", "role") SELECT "discordUserId", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
