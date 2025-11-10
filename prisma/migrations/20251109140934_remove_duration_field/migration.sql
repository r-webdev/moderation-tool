/*
  Warnings:

  - You are about to drop the column `duration` on the `Action` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Action" (
    "actionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "moderatorUserId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" INTEGER NOT NULL,
    "expiresAt" INTEGER,
    "revertingActionId" INTEGER,
    CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Action_moderatorUserId_fkey" FOREIGN KEY ("moderatorUserId") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Action_revertingActionId_fkey" FOREIGN KEY ("revertingActionId") REFERENCES "Action" ("actionId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Action" ("actionId", "createdAt", "expiresAt", "moderatorUserId", "note", "reason", "revertingActionId", "status", "type", "userId") SELECT "actionId", "createdAt", "expiresAt", "moderatorUserId", "note", "reason", "revertingActionId", "status", "type", "userId" FROM "Action";
DROP TABLE "Action";
ALTER TABLE "new_Action" RENAME TO "Action";
CREATE UNIQUE INDEX "Action_revertingActionId_key" ON "Action"("revertingActionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
