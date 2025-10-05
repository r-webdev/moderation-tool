import assert from "node:assert";
import { describe, test } from "node:test";
import { reportMessage } from "../../dist/src/commands/reportMessage.js";

describe("Report Message Command", () => {
  test("should have correct command data", () => {
    assert.strictEqual(reportMessage.data.name, "Report to Moderators");
    assert.strictEqual(reportMessage.data.type, 3); // ApplicationCommandType.Message
  });

  test("should handle missing guild", async () => {
    const mockInteraction = {
      guild: null,
      reply: async (options) => {
        assert.strictEqual(options.content, "This can only be used in a server.");
        assert.strictEqual(options.ephemeral, true);
      },
    };

    await reportMessage.execute(mockInteraction);
  });

  test("should handle missing moderator channel", async () => {
    const mockGuild = {
      channels: {
        fetch: async () => null,
      },
    };

    const mockInteraction = {
      guild: mockGuild,
      reply: async (options) => {
        assert.strictEqual(
          options.content,
          "Moderator channel not found or is not a text channel."
        );
        assert.strictEqual(options.ephemeral, true);
      },
    };

    await reportMessage.execute(mockInteraction);
  });

  test("should handle wrong channel type", async () => {
    const mockChannel = {
      type: 2, // Voice channel instead of text channel
    };

    const mockGuild = {
      channels: {
        fetch: async () => mockChannel,
      },
    };

    const mockInteraction = {
      guild: mockGuild,
      reply: async (options) => {
        assert.strictEqual(
          options.content,
          "Moderator channel not found or is not a text channel."
        );
        assert.strictEqual(options.ephemeral, true);
      },
    };

    await reportMessage.execute(mockInteraction);
  });

  test("should execute report command successfully", async () => {
    const mockChannel = {
      type: 0, // GuildText
      send: async (options) => {
        assert(options.embeds);
        assert.strictEqual(options.embeds.length, 1);

        const embed = options.embeds[0];
        assert.strictEqual(embed.data.title, "🚩 Message Report");
        assert.strictEqual(embed.data.color, 0xff4d4f);
        assert(embed.data.timestamp);
        assert(embed.data.url);
        assert(embed.data.fields);
        assert.strictEqual(embed.data.fields.length, 6);
      },
    };

    const mockGuild = {
      channels: {
        fetch: async () => mockChannel,
      },
    };

    const mockInteraction = {
      guild: mockGuild,
      targetMessage: {
        id: "111111111",
        url: "https://discord.com/channels/987654321/123456789/111111111",
        author: {
          id: "222222222",
          tag: "TargetUser#5678",
        },
      },
      user: {
        id: "123456789",
        tag: "Reporter#1234",
      },
      reply: async (options) => {
        assert.strictEqual(options.content, "Thanks. The message was reported to moderators.");
        assert.strictEqual(options.ephemeral, true);
      },
    };

    await reportMessage.execute(mockInteraction);
  });

  test("should handle missing message author", async () => {
    const mockChannel = {
      type: 0, // GuildText
      send: async (options) => {
        const embed = options.embeds[0];
        const usernameField = embed.data.fields.find((f) => f.name === "Username");
        const userIdField = embed.data.fields.find((f) => f.name === "User ID");
        assert.strictEqual(usernameField.value, "Unknown");
        assert.strictEqual(userIdField.value, "Unknown");
      },
    };

    const mockGuild = {
      channels: {
        fetch: async () => mockChannel,
      },
    };

    const mockInteraction = {
      guild: mockGuild,
      targetMessage: {
        id: "111111111",
        url: "https://discord.com/channels/987654321/123456789/111111111",
        author: null,
      },
      user: {
        id: "123456789",
        tag: "Reporter#1234",
      },
      reply: async () => {},
    };

    await reportMessage.execute(mockInteraction);
  });

  test("should handle channel fetch error", async () => {
    const mockGuild = {
      channels: {
        fetch: async () => {
          throw new Error("Channel not found");
        },
      },
    };

    const mockInteraction = {
      guild: mockGuild,
      reply: async (options) => {
        assert.strictEqual(options.content, "Failed to report the message.");
        assert.strictEqual(options.ephemeral, true);
      },
    };

    await reportMessage.execute(mockInteraction);
  });
});
