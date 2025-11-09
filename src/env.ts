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
  database: {
    url: requireEnv("DATABASE_URL"),
  },
  // Add more config sections as needed:
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
console.log(`🗄️ Database: ${config.database.url ? "***configured***" : "❌ missing"}`);
