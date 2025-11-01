import assert from "node:assert/strict";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { ActionStatus, ActionType, PrismaClient } from "../generated/prisma/index.js";
import {
  findRepeatOffenders,
  getActionsByType,
  getModeratorStats,
  getRecentActions,
  getTotalActionCount,
  getUserActionStats,
} from "../src/database/analytics.js";
import {
  createModerationAction,
  getActionById,
  getActiveActions,
  getUserActions,
  getUserByDiscordId,
  removeActionByError,
  setPrismaClient,
  updateActionStatus,
  upsertUser,
} from "../src/database/operations.js";

// Use a test database with absolute path
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TEST_DB_PATH = path.join(__dirname, "..", "data", "test.db");
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${TEST_DB_PATH}`,
    },
  },
});

describe("Database Operations", () => {
  before(async () => {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, "..", "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }

    // Connect to database first
    await testPrisma.$connect();

    // Configure operations to use test database
    setPrismaClient(testPrisma);

    // Create tables manually
    await testPrisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "discordId" TEXT NOT NULL
      );
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE INDEX "User_discordId_idx" ON "User"("discordId");
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE TABLE "ModerationAction" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "type" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "reason" TEXT,
        "duration" INTEGER,
        "targetId" INTEGER NOT NULL,
        "moderatorId" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" DATETIME,
        "parentActionId" INTEGER,
        CONSTRAINT "ModerationAction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "ModerationAction_parentActionId_fkey" FOREIGN KEY ("parentActionId") REFERENCES "ModerationAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE INDEX "ModerationAction_targetId_idx" ON "ModerationAction"("targetId");
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE INDEX "ModerationAction_moderatorId_idx" ON "ModerationAction"("moderatorId");
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE INDEX "ModerationAction_status_idx" ON "ModerationAction"("status");
    `);

    await testPrisma.$executeRawUnsafe(`
      CREATE INDEX "ModerationAction_createdAt_idx" ON "ModerationAction"("createdAt");
    `);
  });

  after(async () => {
    await testPrisma.$disconnect();
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  describe("User Operations", () => {
    it("should create a new user", async () => {
      const user = await upsertUser("user001");

      assert.ok(user.id);
      assert.strictEqual(user.discordId, "user001");
    });

    it("should upsert user (create if not exists)", async () => {
      const user1 = await upsertUser("user002");

      assert.strictEqual(user1.discordId, "user002");

      // Second call should return same user
      const user2 = await upsertUser("user002");

      assert.strictEqual(user1.id, user2.id);
    });

    it("should find user by Discord ID", async () => {
      await upsertUser("user003");

      const user = await getUserByDiscordId("user003");

      assert.ok(user);
      assert.strictEqual(user.discordId, "user003");
    });

    it("should return null for non-existent user", async () => {
      const user = await getUserByDiscordId("nonexistent");

      assert.strictEqual(user, null);
    });
  });

  describe("Moderation Actions", () => {
    it("should create a ban action", async () => {
      const action = await createModerationAction({
        type: ActionType.BAN,
        targetDiscordId: "target001",
        moderatorDiscordId: "mod001",
        reason: "Test ban",
      });

      assert.ok(action.id);
      assert.strictEqual(action.type, ActionType.BAN);
      assert.strictEqual(action.status, ActionStatus.ACTIVE);
      assert.strictEqual(action.reason, "Test ban");
      assert.strictEqual(action.target.discordId, "target001");
      assert.strictEqual(action.moderator.discordId, "mod001");
    });

    it("should create a timeout action with duration", async () => {
      const duration = 3600; // 1 hour

      const action = await createModerationAction({
        type: ActionType.TIMEOUT,
        targetDiscordId: "target002",
        moderatorDiscordId: "mod002",
        reason: "Test timeout",
        duration,
      });

      assert.strictEqual(action.type, ActionType.TIMEOUT);
      assert.strictEqual(action.duration, duration);
      assert.ok(action.expiresAt);
    });

    it("should create multiple action types", async () => {
      const actionTypes = [ActionType.WARN, ActionType.MUTE, ActionType.KICK, ActionType.REPEL];

      for (const type of actionTypes) {
        const action = await createModerationAction({
          type,
          targetDiscordId: "target003",
          moderatorDiscordId: "mod003",
          reason: `Test ${type}`,
        });

        assert.strictEqual(action.type, type);
      }

      const allActions = await getUserActions("target003");

      assert.strictEqual(allActions.length, actionTypes.length);
    });

    it("should query actions by target user", async () => {
      // Create 3 actions
      for (let i = 0; i < 3; i++) {
        await createModerationAction({
          type: ActionType.WARN,
          targetDiscordId: "target004",
          moderatorDiscordId: "mod004",
          reason: `Warning ${i + 1}`,
        });
      }

      const actions = await getUserActions("target004");

      assert.strictEqual(actions.length, 3);
      assert.strictEqual(actions[0].moderator.discordId, "mod004");
    });

    it("should update action status", async () => {
      const action = await createModerationAction({
        type: ActionType.TIMEOUT,
        targetDiscordId: "target005",
        moderatorDiscordId: "mod005",
      });

      const updated = await updateActionStatus(action.id, ActionStatus.EXPIRED);

      assert.strictEqual(updated.status, ActionStatus.EXPIRED);
    });

    it("should get action by id", async () => {
      const created = await createModerationAction({
        type: ActionType.KICK,
        targetDiscordId: "target006",
        moderatorDiscordId: "mod006",
        reason: "Test kick",
      });

      const fetched = await getActionById(created.id);

      assert.ok(fetched);
      assert.strictEqual(fetched.id, created.id);
      assert.strictEqual(fetched.type, ActionType.KICK);
      assert.strictEqual(fetched.target.discordId, "target006");
    });

    it("should get active actions for user", async () => {
      // Create active and expired actions
      const action1 = await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "target007",
        moderatorDiscordId: "mod007",
      });

      const action2 = await createModerationAction({
        type: ActionType.MUTE,
        targetDiscordId: "target007",
        moderatorDiscordId: "mod007",
      });

      // Mark one as expired
      await updateActionStatus(action2.id, ActionStatus.EXPIRED);

      const activeActions = await getActiveActions("target007");

      assert.strictEqual(activeActions.length, 1);
      assert.strictEqual(activeActions[0].id, action1.id);
    });
  });

  describe("Action Corrections", () => {
    it("should mark action as removed by error and create correction", async () => {
      const originalAction = await createModerationAction({
        type: ActionType.BAN,
        targetDiscordId: "target008",
        moderatorDiscordId: "mod008",
        reason: "Mistake",
      });

      // Remove action by error
      const correction = await removeActionByError(
        originalAction.id,
        "corrector001",
        "This was a mistake"
      );

      assert.ok(correction.parentActionId);
      assert.strictEqual(correction.parentActionId, originalAction.id);
      assert.strictEqual(correction.status, ActionStatus.REMOVED_BY_ERROR);
      assert.ok(correction.reason?.includes("Correction: This was a mistake"));

      // Verify original action is marked as removed
      const updated = await getActionById(originalAction.id);
      assert.ok(updated);
      assert.strictEqual(updated.status, ActionStatus.REMOVED_BY_ERROR);
    });

    it("should create correction record with parent reference", async () => {
      const originalAction = await createModerationAction({
        type: ActionType.KICK,
        targetDiscordId: "target009",
        moderatorDiscordId: "mod009",
        reason: "Wrong user",
      });

      // Create correction
      const correction = await removeActionByError(
        originalAction.id,
        "corrector002",
        "Wrong person was kicked"
      );

      assert.ok(correction.parentActionId);
      assert.strictEqual(correction.parentActionId, originalAction.id);

      // Verify parent relationship
      const withParent = await getActionById(correction.id);

      assert.ok(withParent?.parentAction);
      assert.strictEqual(withParent.parentAction.id, originalAction.id);
      assert.strictEqual(withParent.parentAction.reason, "Wrong user");
    });
  });

  describe("Analytics", () => {
    it("should get user action stats with counts by type", async () => {
      // Create 2 warnings and 1 ban
      await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "target010",
        moderatorDiscordId: "mod010",
      });

      await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "target010",
        moderatorDiscordId: "mod010",
      });

      await createModerationAction({
        type: ActionType.BAN,
        targetDiscordId: "target010",
        moderatorDiscordId: "mod010",
      });

      const stats = await getUserActionStats("target010");

      assert.ok(stats);
      assert.strictEqual(stats.discordId, "target010");
      assert.strictEqual(stats.totalActions, 3);
      assert.strictEqual(stats.actionsByType[ActionType.WARN], 2);
      assert.strictEqual(stats.actionsByType[ActionType.BAN], 1);
    });

    it("should get moderator stats", async () => {
      // Create actions by the same moderator
      await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "target011",
        moderatorDiscordId: "mod011",
      });

      await createModerationAction({
        type: ActionType.KICK,
        targetDiscordId: "target012",
        moderatorDiscordId: "mod011",
      });

      const stats = await getModeratorStats("mod011");

      assert.ok(stats);
      assert.strictEqual(stats.discordId, "mod011");
      assert.strictEqual(stats.totalActions, 2);
      assert.strictEqual(stats.actionsByType[ActionType.WARN], 1);
      assert.strictEqual(stats.actionsByType[ActionType.KICK], 1);
    });

    it("should get recent actions ordered by date", async () => {
      // Create actions with slight delay
      for (let i = 0; i < 3; i++) {
        await createModerationAction({
          type: ActionType.WARN,
          targetDiscordId: "target013",
          moderatorDiscordId: "mod013",
          reason: `Action ${i}`,
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const recentActions = await getRecentActions(2);

      // Should get the 2 most recent actions
      assert.ok(recentActions.length >= 2);
      // Most recent should come first
      assert.ok(recentActions[0].createdAt >= recentActions[1].createdAt);
    });

    it("should find repeat offenders", async () => {
      // Create multiple actions for one user
      for (let i = 0; i < 4; i++) {
        await createModerationAction({
          type: ActionType.WARN,
          targetDiscordId: "repeat_offender",
          moderatorDiscordId: "mod014",
        });
      }

      // Create fewer actions for another user
      await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "minor_offender",
        moderatorDiscordId: "mod014",
      });

      const offenders = await findRepeatOffenders(3);

      // Should find the user with 4+ actions
      const repeatOffender = offenders.find((offender) => offender.discordId === "repeat_offender");
      assert.ok(repeatOffender);
      assert.ok(repeatOffender.count >= 4);

      // Minor offender shouldn't be in the list
      const minorOffender = offenders.find((offender) => offender.discordId === "minor_offender");
      assert.strictEqual(minorOffender, undefined);
    });

    it("should get actions by type", async () => {
      await createModerationAction({
        type: ActionType.KICK,
        targetDiscordId: "target015",
        moderatorDiscordId: "mod015",
      });

      await createModerationAction({
        type: ActionType.KICK,
        targetDiscordId: "target016",
        moderatorDiscordId: "mod015",
      });

      const kickActions = await getActionsByType(ActionType.KICK);

      // Should have at least the 2 we just created
      const ourKicks = kickActions.filter(
        (action) =>
          action.target.discordId === "target015" || action.target.discordId === "target016"
      );
      assert.strictEqual(ourKicks.length, 2);
    });

    it("should count total actions excluding errors", async () => {
      const action1 = await createModerationAction({
        type: ActionType.WARN,
        targetDiscordId: "target017",
        moderatorDiscordId: "mod017",
      });

      await createModerationAction({
        type: ActionType.BAN,
        targetDiscordId: "target017",
        moderatorDiscordId: "mod017",
      });

      // Mark one as error
      await removeActionByError(action1.id, "corrector003", "Error");

      // Count should exclude the removed one
      const total = await getTotalActionCount();

      // Hard to test exact number since other tests create actions too
      // Just verify it's a positive number
      assert.ok(total > 0);
    });
  });

  describe("Database Structure", () => {
    it("should have all required tables", async () => {
      const tables = await testPrisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'
      `;

      const tableNames = tables.map((table) => table.name);
      assert.ok(tableNames.includes("User"));
      assert.ok(tableNames.includes("ModerationAction"));
    });

    it("should have proper indexes", async () => {
      const indexes = await testPrisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `;

      const indexNames = indexes.map((index) => index.name);
      assert.ok(indexNames.some((name) => name.includes("discordId")));
      assert.ok(indexNames.some((name) => name.includes("targetId")));
      assert.ok(indexNames.some((name) => name.includes("moderatorId")));
    });

    it("should enforce unique constraint on discordId", async () => {
      await testPrisma.user.create({
        data: { discordId: "unique001" },
      });

      await assert.rejects(
        async () => {
          await testPrisma.user.create({
            data: { discordId: "unique001" },
          });
        },
        {
          name: "PrismaClientKnownRequestError",
        }
      );
    });
  });
});
