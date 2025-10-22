# Discord Moderation Tool

A TypeScript Discord bot built with Discord.js v14, designed for server moderation with a clean, type-safe architecture.

## Features

- **Slash Commands**: Traditional `/command` style interactions
- **Context Menu Commands**: Right-click context menus for users and messages
- **Event-Driven Architecture**: Modular event handling system
- **Type-Safe**: Full TypeScript support with discriminated unions
- **Environment Configuration**: Secure configuration management
- **Command Helpers**: Easy-to-use helpers for creating different command types

## Installation

### Prerequisites

- Node.js 22.20.0+
- pnpm (recommended) or npm
- A Discord bot token

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moderation-tool
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ```

4. **Build and run**
   ```bash
   # Development (with hot reload)
   pnpm dev

   # Production build
   pnpm build:ci
   pnpm start:ci
   ```


## Creating Commands

### Slash Commands

Use `createSlashCommand` helper for traditional `/command` interactions:

```typescript
import { createSlashCommand } from "../commands/helpers.js";

export const ping = createSlashCommand({
  data: {
    name: "ping",  // Must be lowercase
    description: "Replies with Pong!",
    options: [     // Optional: command options
      {
        name: "message",
        description: "Optional message to include",
        type: ApplicationCommandOptionType.String,
        required: false,
      }
    ]
  },
  execute: async (interaction) => {
    await interaction.reply("Pong!");
  },
});
```

### Context Menu Commands

#### User Context Menu Commands

```typescript
import { createUserContextMenuCommand } from "../commands/helpers.js";

export const userInfo = createUserContextMenuCommand({
  data: {
    name: "Get User Info",  // Can contain spaces and capitals
  },
  execute: async (interaction) => {
    const targetUser = interaction.targetUser;
    await interaction.reply(`User: ${targetUser.tag}`);
  },
});
```

#### Message Context Menu Commands

```typescript
import { createMessageContextMenuCommand } from "../commands/helpers.js";

export const reportMessage = createMessageContextMenuCommand({
  data: {
    name: "Report to Moderators",
  },
  execute: async (interaction) => {
    const targetMessage = interaction.targetMessage;
    // Handle message reporting logic
    await interaction.reply("Message reported!");
  },
});
```

### Registering Commands

Add your commands to `src/commands/index.ts`:

```typescript
import { ping } from "./ping.js";
import { reportMessage } from "./reportMessage.js";
import type { Command } from "./types.js";

export const commands = new Map<string, Command>(
  [ping, reportMessage].flat().map((command) => [command.data.name, command])
);
```

## Creating Events

Events are handled automatically through the event system. Create new events using the `createEvent` helper:

```typescript
import { Events } from "discord.js";
import { createEvent } from "../events/helpers.js";

export const messageCreateEvent = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (message.author.bot) return;

    // Handle message logic
    console.log(`Message from ${message.author.tag}: ${message.content}`);
  }
);
```

### Registering Events

Add your events to `src/events/index.ts`:

```typescript
import { messageCreateEvent } from "./message-create/index.js";
import { readyEvent } from "./ready/index.js";
import type { DiscordEvent } from "./types.js";

export const events: DiscordEvent[] = [readyEvent, messageCreateEvent];
```

## Configuration

The bot uses a centralized configuration system in `src/env.ts`. Environment variables are validated and logged on startup.

### Required Environment Variables

- `DISCORD_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your Discord application client ID
- `GUILD_ID`: Guild ID for guild-specific command registration

## Development

### Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build:ci` - Build for production
- `pnpm start:ci` - Run production build
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Lint code with Biome
- `pnpm format` - Format code with Biome

### Code Quality

This project uses:
- **Biome** for linting and formatting
- **TypeScript** for type safety
- **Husky** + **lint-staged** for pre-commit hooks

### Adding New Features

1. **Commands**: Create in `src/commands/` and register in `src/commands/index.ts`
2. **Events**: Create in `src/events/` and register in `src/events/index.ts`
3. **Utilities**: Add to `src/utils/`
4. **Configuration**: Update `src/env.ts` for new environment variables

## Deployment

1. Build the project:
   ```bash
   pnpm build:ci
   ```

2. Set environment variables in your deployment platform

3. Run the production build:
   ```bash
   pnpm start:ci
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT