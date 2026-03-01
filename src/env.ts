import "./loadEnvFile.js";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Required environment variable ${key} is not set`);
    console.error("Please check your .env.local file or CI/CD configuration");
    process.exit(1);
  }
  return value;
}

// Single source of truth for all configuration
export const config = {
  discord: {
    token: requireEnv("DISCORD_TOKEN"),
    clientId: requireEnv("CLIENT_ID"),
    serverId: requireEnv("SERVER_ID"),
  },
  spamDetection: {
    channelId: requireEnv("SPAM_DETECTION_CHANNEL_ID"),
  },
  roles: {
    regularId: requireEnv("ROLE_REGULAR_ID"),
  },
  channels: {
    actionLogId: requireEnv("ACTION_LOG_CHANNEL_ID"),
  },
  // Add more config sections as needed:
  // database: {
  //   url: requireEnv('DATABASE_URL'),
  // },
  // api: {
  //   openaiKey: optionalEnv('OPENAI_API_KEY'),
  // },
};

export type Config = typeof config;

// Log loaded configuration (without sensitive values)
console.log("✅ Configuration loaded successfully");
console.log(`📋 Client ID: ${config.discord.clientId ? config.discord.clientId : "❌ missing"}`);
console.log(`🔑 Token: ${config.discord.token ? "***configured***" : "❌ missing"}`);
console.log(`🔑 Guild ID: ${config.discord.serverId ? config.discord.serverId : "Global"}`);
