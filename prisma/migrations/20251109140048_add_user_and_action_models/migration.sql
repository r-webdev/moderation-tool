/*
  Warnings:

  - You are about to drop the `ModerationAction` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discordId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - Added the required column `discordUserId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ModerationAction_createdAt_idx";

-- DropIndex
DROP INDEX "ModerationAction_status_idx";

-- DropIndex
DROP INDEX "ModerationAction_moderatorId_idx";

-- DropIndex
DROP INDEX "ModerationAction_targetId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ModerationAction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Action" (
    "actionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "duration" INTEGER,
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "userId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER'
);
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Action_revertingActionId_key" ON "Action"("revertingActionId");
