<!-- b7b83c34-1c7a-4e5d-a61a-9947e08363b7 b7ef67ef-a485-4614-ba9f-2144dff7cbe9 -->
# Database Implementation for Discord Moderation Tool

## Overview

Implement SQLite database with Prisma to track all moderation actions (warn, mute, unmute, kick, ban, unban, timeout, remove_timeout, repel) with full audit history and error correction capabilities. This plan focuses solely on database setup and operations - Discord bot command integration will be handled separately.

## Current State

- ✅ Prisma installed (`@prisma/client`, `@prisma/adapter-better-sqlite3`)
- ✅ Basic User model in `prisma/schema.prisma`
- ✅ Docker setup complete with profiles (dev/prod)
- ✅ Volume persistence configured (`./data:/app/data`)

## Exact Database Schema

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/dev.db"
}

model User {
  id               Int                  @id @default(autoincrement())
  discordId        String               @unique
  
  // Relations
  actionsReceived  ModerationAction[]   @relation("ActionTarget")
  actionsPerformed ModerationAction[]   @relation("ActionModerator")
  
  @@index([discordId])
}

enum ActionType {
  WARN
  MUTE
  UNMUTE
  KICK
  BAN
  UNBAN
  TIMEOUT
  REMOVE_TIMEOUT
  REPEL
}

enum ActionStatus {
  ACTIVE
  EXPIRED
  REMOVED_BY_ERROR
  REVERSED
}

model ModerationAction {
  id             Int                  @id @default(autoincrement())
  type           ActionType
  status         ActionStatus         @default(ACTIVE)
  reason         String?
  duration       Int?                 // Duration in seconds for timeouts/mutes
  
  // User relationships
  targetId       Int
  target         User                 @relation("ActionTarget", fields: [targetId], references: [id])
  moderatorId    Int
  moderator      User                 @relation("ActionModerator", fields: [moderatorId], references: [id])
  
  // Timestamps
  createdAt      DateTime             @default(now())
  expiresAt      DateTime?
  
  // For corrections/reversals
  parentActionId Int?
  parentAction   ModerationAction?    @relation("ActionCorrections", fields: [parentActionId], references: [id])
  corrections    ModerationAction[]   @relation("ActionCorrections")
  
  @@index([targetId])
  @@index([moderatorId])
  @@index([status])
  @@index([createdAt])
}
```

## Database Operations Module

Create `src/database/operations.ts`:

```typescript
import { PrismaClient, ActionType, ActionStatus } from "../../generated/prisma/index.js";

export const prisma = new PrismaClient();

// Connect to database and verify connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    // Test query to verify connection
    await prisma.user.findFirst();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

// Disconnect from database
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log("Database disconnected");
}

// User operations - only Discord ID needed
export async function upsertUser(discordId: string) {
  return await prisma.user.upsert({
    where: { discordId },
    update: {},
    create: { discordId },
  });
}

export async function getUserByDiscordId(discordId: string) {
  return await prisma.user.findUnique({
    where: { discordId },
  });
}

// Moderation action operations
type CreateActionParams = {
  type: ActionType;
  targetDiscordId: string;
  moderatorDiscordId: string;
  reason?: string;
  duration?: number;
};

export async function createModerationAction(params: CreateActionParams) {
  // Ensure both users exist
  const target = await upsertUser(params.targetDiscordId);
  const moderator = await upsertUser(params.moderatorDiscordId);
  
  // Calculate expiry for timed actions
  const expiresAt = params.duration 
    ? new Date(Date.now() + params.duration * 1000)
    : null;
  
  return await prisma.moderationAction.create({
    data: {
      type: params.type,
      reason: params.reason,
      duration: params.duration,
      targetId: target.id,
      moderatorId: moderator.id,
      expiresAt,
    },
    include: {
      target: true,
      moderator: true,
    },
  });
}

export async function removeActionByError(
  actionId: number,
  removedByDiscordId: string,
  reason: string
) {
  const removedBy = await upsertUser(removedByDiscordId);
  
  // Mark original action as removed
  const originalAction = await prisma.moderationAction.update({
    where: { id: actionId },
    data: { status: ActionStatus.REMOVED_BY_ERROR },
  });
  
  // Create correction record
  return await prisma.moderationAction.create({
    data: {
      type: originalAction.type,
      status: ActionStatus.REMOVED_BY_ERROR,
      reason: `Correction: ${reason}`,
      targetId: originalAction.targetId,
      moderatorId: removedBy.id,
      parentActionId: originalAction.id,
    },
    include: {
      parentAction: true,
    },
  });
}

export async function getUserActions(discordId: string, limit = 50) {
  const user = await getUserByDiscordId(discordId);
  if (!user) return [];
  
  return await prisma.moderationAction.findMany({
    where: { targetId: user.id },
    include: {
      moderator: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getActiveActions(discordId: string) {
  const user = await getUserByDiscordId(discordId);
  if (!user) return [];
  
  return await prisma.moderationAction.findMany({
    where: { 
      targetId: user.id,
      status: ActionStatus.ACTIVE,
    },
    include: {
      moderator: true,
    },
  });
}

export async function getActionById(actionId: number) {
  return await prisma.moderationAction.findUnique({
    where: { id: actionId },
    include: {
      target: true,
      moderator: true,
      parentAction: true,
    },
  });
}

export async function updateActionStatus(actionId: number, status: ActionStatus) {
  return await prisma.moderationAction.update({
    where: { id: actionId },
    data: { status },
  });
}
```

## Analytics Module

Create `src/database/analytics.ts`:

```typescript
import { prisma } from "./operations.js";
import { ActionType, ActionStatus } from "../../generated/prisma/index.js";

export async function getUserActionStats(discordId: string) {
  const user = await prisma.user.findUnique({
    where: { discordId },
    include: {
      actionsReceived: {
        where: {
          status: { in: [ActionStatus.ACTIVE, ActionStatus.EXPIRED] }
        }
      }
    }
  });
  
  if (!user) return null;
  
  const actionsByType = user.actionsReceived.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<ActionType, number>);
  
  return {
    discordId: user.discordId,
    totalActions: user.actionsReceived.length,
    actionsByType,
  };
}

export async function getModeratorStats(discordId: string, days = 30) {
  const user = await prisma.user.findUnique({
    where: { discordId },
  });
  
  if (!user) return null;
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const actions = await prisma.moderationAction.findMany({
    where: {
      moderatorId: user.id,
      createdAt: { gte: since },
      status: { not: ActionStatus.REMOVED_BY_ERROR }
    }
  });
  
  const actionsByType = actions.reduce((acc, action) => {
    acc[action.type] = (acc[action.type] || 0) + 1;
    return acc;
  }, {} as Record<ActionType, number>);
  
  return {
    discordId: user.discordId,
    totalActions: actions.length,
    actionsByType,
    period: `${days} days`,
  };
}

export async function getRecentActions(limit = 20) {
  return await prisma.moderationAction.findMany({
    include: {
      target: true,
      moderator: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function findRepeatOffenders(minActions = 3) {
  const actions = await prisma.moderationAction.findMany({
    where: { 
      status: { in: [ActionStatus.ACTIVE, ActionStatus.EXPIRED] }
    },
    include: {
      target: true,
    }
  });
  
  const userActionCounts = actions.reduce((acc, action) => {
    const discordId = action.target.discordId;
    if (!acc[discordId]) {
      acc[discordId] = { discordId, count: 0, actions: [] };
    }
    acc[discordId].count++;
    acc[discordId].actions.push(action);
    return acc;
  }, {} as Record<string, { discordId: string; count: number; actions: any[] }>);
  
  return Object.values(userActionCounts)
    .filter(item => item.count >= minActions)
    .sort((a, b) => b.count - a.count);
}

export async function getActionsByType(actionType: ActionType, limit = 50) {
  return await prisma.moderationAction.findMany({
    where: { type: actionType },
    include: {
      target: true,
      moderator: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getTotalActionCount() {
  return await prisma.moderationAction.count({
    where: {
      status: { not: ActionStatus.REMOVED_BY_ERROR }
    }
  });
}
```

## Initialize Database in Main

Update `index.ts` to initialize Prisma with explicit connection:

```typescript
import { connectDatabase, disconnectDatabase } from "./src/database/operations.js";

// ... existing imports and code ...

// Connect to database before starting bot
await connectDatabase();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log("Shutting down...");
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("Shutting down...");
  await disconnectDatabase();
  process.exit(0);
});
```

## Implementation Steps

1. **Update Schema**: Replace `prisma/schema.prisma` with new schema
2. **Run Migration**: `pnpm prisma migrate dev --name add_moderation_tables`
3. **Generate Client**: `pnpm prisma generate`
4. **Create Operations**: Add `src/database/operations.ts` with all CRUD functions
5. **Create Analytics**: Add `src/database/analytics.ts` with analytics queries
6. **Initialize Database**: Update `index.ts` with connectDatabase/disconnectDatabase calls
7. **Test Connection**: Run bot and verify database connection logs

## Volume Management

Database location: `./data/dev.db`

```bash
# Run development
docker-compose --profile dev up

# Run production
docker-compose --profile prod up -d

# Backup database
cp ./data/dev.db ./backup_$(date +%Y%m%d).db

# Restore database
cp ./backup_20250101.db ./data/dev.db

# View database with sqlite3
sqlite3 ./data/dev.db

# View all tables
sqlite3 ./data/dev.db ".tables"

# View schema
sqlite3 ./data/dev.db ".schema"
```

## Files to Create

- `src/database/operations.ts` - Database CRUD operations (Discord ID only)
- `src/database/analytics.ts` - Analytics and reporting queries

## Files to Modify

- `prisma/schema.prisma` - Complete schema definition
- `index.ts` - Initialize database connection with explicit connect/disconnect

## Usage Examples

After implementation, Discord commands can use the database operations:

```typescript
// Create a ban action
await createModerationAction({
  type: ActionType.BAN,
  targetDiscordId: "123456789",
  moderatorDiscordId: "987654321",
  reason: "Spam",
});

// Get user's action history
const actions = await getUserActions("123456789");

// Get user statistics
const stats = await getUserActionStats("123456789");

// Find repeat offenders
const offenders = await findRepeatOffenders(3);
```

### To-dos

- [ ] Update prisma/schema.prisma with User, ActionType, ActionStatus, and ModerationAction models
- [ ] Create and run Prisma migration: pnpm prisma migrate dev --name add_moderation_tables
- [ ] Create src/database/operations.ts with CRUD functions for users and moderation actions
- [ ] Create src/database/analytics.ts with analytics query helpers
- [ ] Update index.ts to initialize Prisma client and handle graceful shutdown
- [ ] Create src/commands/ban/index.ts command with database logging
- [ ] Create src/commands/kick/index.ts command with database logging
- [ ] Create src/commands/warn/index.ts command with database logging
- [ ] Create src/commands/timeout/index.ts command with database logging
- [ ] Create src/commands/repel/index.ts command with database logging
- [ ] Create src/commands/remove-action/index.ts for correcting errors
- [ ] Create src/commands/history/index.ts to view user moderation history
- [ ] Update src/commands/index.ts to register all new moderation commands