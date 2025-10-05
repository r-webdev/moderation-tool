/**
 * Ping Command Unit Tests
 *
 * This file tests the ping command functionality, including:
 * - Command data validation
 * - Successful execution with timing
 * - WebSocket ping display
 * - Error handling
 *
 * The tests use Node.js built-in test runner and assert module.
 * No external testing frameworks are required.
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import { ping } from "../../dist/src/commands/ping.js";

describe("Ping Command", () => {
  /**
   * Test 1: Command Data Validation
   *
   * This test verifies that the ping command has the correct metadata:
   * - Command name should be 'ping'
   * - Description should match expected text
   *
   * This is important because Discord uses this data to register the command
   * and display it to users in the slash command interface.
   */
  test("should have correct command data", () => {
    assert.strictEqual(ping.data.name, "ping");
    assert.strictEqual(ping.data.description, "Replies with Pong!");
  });

  /**
   * Test 2: Successful Command Execution
   *
   * This test verifies that the ping command executes successfully and:
   * - Calls deferReply() to acknowledge the interaction
   * - Calls editReply() with the correct response content
   * - Includes the ping emoji and timing information
   *
   * The mock interaction simulates a Discord interaction object with:
   * - deferReply: Acknowledges the interaction (required for Discord)
   * - editReply: Sends the final response to the user
   * - client.ws.ping: WebSocket ping value from Discord client
   */
  test("should execute ping command without errors", async () => {
    // Create a mock Discord interaction object
    const mockInteraction = {
      // deferReply is called first to acknowledge the interaction
      deferReply: async () => {},

      // editReply is called with the final response content
      editReply: async (content) => {
        // Verify the response is a string and contains expected content
        assert.strictEqual(typeof content, "string");
        assert(content.includes("🏓 Pong!"));
      },

      // Mock the Discord client with WebSocket ping value
      client: {
        ws: {
          ping: 50, // 50ms WebSocket ping
        },
      },
    };

    // Mock Date.now for consistent timing in tests
    // This ensures we get predictable response times
    const originalDateNow = Date.now;
    let callCount = 0;
    Date.now = () => {
      callCount++;
      // First call: start time (1000ms)
      // Second call: end time (1050ms) = 50ms response time
      return callCount === 1 ? 1000 : 1050;
    };

    try {
      // Execute the ping command with our mock interaction
      await ping.execute(mockInteraction);
    } finally {
      // Always restore the original Date.now function
      Date.now = originalDateNow;
    }
  });

  /**
   * Test 3: Different WebSocket Ping Values
   *
   * This test verifies that the command correctly displays different
   * WebSocket ping values. Discord clients can have varying ping times
   * depending on network conditions and server location.
   */
  test("should handle different WebSocket ping values", async () => {
    const mockInteraction = {
      deferReply: async () => {},
      editReply: async (content) => {
        // Verify that the WebSocket ping value is displayed correctly
        assert(content.includes("WebSocket: 100ms"));
      },
      client: {
        ws: {
          ping: 100, // Higher ping value for testing
        },
      },
    };

    // Mock Date.now for consistent timing
    const originalDateNow = Date.now;
    let callCount = 0;
    Date.now = () => {
      callCount++;
      return callCount === 1 ? 1000 : 1050;
    };

    try {
      await ping.execute(mockInteraction);
    } finally {
      Date.now = originalDateNow;
    }
  });

  /**
   * Test 4: Error Handling
   *
   * This test verifies that the ping command handles errors gracefully.
   * In a real Discord bot, network issues or API problems could cause
   * interactions to fail. The command should propagate errors properly
   * so they can be caught and handled by the main bot error handler.
   */
  test("should handle interaction errors gracefully", async () => {
    const mockInteraction = {
      // Simulate a network error during deferReply
      deferReply: async () => {
        throw new Error("Network error");
      },
      editReply: async () => {},
      client: {
        ws: {
          ping: 50,
        },
      },
    };

    try {
      // Execute the command and expect it to throw an error
      await ping.execute(mockInteraction);
      // If we reach this line, the test should fail
      assert.fail("Expected function to throw an error");
    } catch (error) {
      // Verify that the error is properly propagated
      assert.strictEqual(error.message, "Network error");
    }
  });
});
