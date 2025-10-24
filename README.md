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
   SERVER_ID=your_guild_id_here
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
- `SERVER_ID`: Guild ID (Server ID) for guild-specific command registration

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

This project includes automated deployment using GitHub Actions and Docker with direct SSH deployment to your VPS.

### Prerequisites

- A VPS with Docker and Docker Compose installed
- SSH access to your VPS
- GitHub repository with Actions enabled
- Discord bot credentials

### GitHub Actions Setup

1. **Set up repository secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VPS_HOST`: Your VPS IP address or hostname
     - `VPS_USER`: SSH username for your VPS
     - `VPS_SSH_KEY`: Private SSH key for authentication
     - `DISCORD_TOKEN`: Your Discord bot token
     - `CLIENT_ID`: Your Discord application client ID
     - `SERVER_ID`: Your Discord server (guild) ID

### VPS Setup

The CI/CD pipeline handles all the setup automatically. The first deployment will:
- Create the `moderation-tool-bot` directory on your VPS
- Clone the repository and set up the environment
- Subsequent deployments will simply pull the latest changes

### Automated Deployment

The GitHub Actions workflow will automatically:
- Build and test on every push/PR to main branch
- SSH directly to your VPS
- Create project directory if it doesn't exist
- Clone repository on first deployment
- Pull latest code changes on subsequent deployments
- Build Docker image on the VPS
- Deploy using Docker Compose with production profile
- Verify deployment success and show container status

### Monitoring

```bash
# View logs
docker compose logs -f

# Check container status
docker compose ps

# Restart the bot
docker compose restart moderation-tool-bot

# Stop the bot
docker compose down
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT