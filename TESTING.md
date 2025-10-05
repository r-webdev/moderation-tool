# Discord Bot Testing Guide

This document explains how to write and run unit tests for Discord bot commands using Node.js native test runner.

## Overview

The testing setup uses Node.js built-in test runner (no external dependencies) to test Discord bot commands. The tests verify command data, execution logic, error handling, and edge cases.

**Note**: Tests are located next to the files they test, following the convention `*.test.js` alongside the source files.

## Test Structure

```
src/
├── commands/
│   ├── ping.ts
│   ├── ping.test.js                   # Tests for ping command
│   ├── reportMessage.ts
│   ├── reportMessage.test.js          # Tests for report message command
│   ├── index.ts
│   └── index.test.js                  # Tests for command exports
└── utils/
    ├── loadCommands.ts
    └── loadCommands.test.js            # Tests for command loading utility
```

## Running Tests

### Run all tests
```bash
npm test
# or
pnpm test
```

### Run tests in watch mode
```bash
npm run test:watch
# or
pnpm test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
# or
pnpm test:coverage
```

### Run specific test files
```bash
node --test src/commands/ping.test.js
node --test src/commands/reportMessage.test.js
```

## Test Examples

### Simple Test Pattern
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ping } from '../../dist/src/commands/ping.js';

describe('Ping Command', () => {
  test('should have correct command data', () => {
    assert.strictEqual(ping.data.name, 'ping');
    assert.strictEqual(ping.data.description, 'Replies with Pong!');
  });

  test('should execute ping command without errors', async () => {
    const mockInteraction = {
      deferReply: async () => {},
      editReply: async (content) => {
        assert.strictEqual(typeof content, 'string');
        assert(content.includes('🏓 Pong!'));
      },
      client: {
        ws: { ping: 50 }
      }
    };

    await ping.execute(mockInteraction);
  });
});
```

### Testing Error Handling
```javascript
test('should handle missing guild', async () => {
  const mockInteraction = {
    guild: null,
    reply: async (options) => {
      assert.strictEqual(options.content, 'This can only be used in a server.');
      assert.strictEqual(options.ephemeral, true);
    }
  };

  await reportMessage.execute(mockInteraction);
});
```

### Testing with Mocked Dependencies
```javascript
test('should execute report command successfully', async () => {
  const mockChannel = {
    type: 0, // GuildText
    send: async (options) => {
      assert(options.embeds);
      assert.strictEqual(options.embeds.length, 1);
      
      const embed = options.embeds[0];
      assert.strictEqual(embed.data.title, '🚩 Message Report');
    }
  };

  const mockGuild = {
    channels: {
      fetch: async () => mockChannel
    }
  };

  const mockInteraction = {
    guild: mockGuild,
    targetMessage: { /* ... */ },
    user: { /* ... */ },
    reply: async (options) => {
      assert.strictEqual(options.content, 'Thanks. The message was reported to moderators.');
    }
  };

  await reportMessage.execute(mockInteraction);
});
```

## Test Categories

### 1. Command Data Tests
- ✅ Command name and description
- ✅ Command type (slash vs context menu)
- ✅ Required options/parameters

### 2. Command Execution Tests
- ✅ Successful execution
- ✅ Error handling
- ✅ Different input scenarios
- ✅ Permission checks
- ✅ Guild/DM context handling

### 3. Integration Tests
- ✅ Command loading
- ✅ Command registration
- ✅ Event handling

## Best Practices

1. **Use simple mocks** - Create minimal mock objects that only include what's needed
2. **Test both success and error cases** - Ensure robust error handling
3. **Use descriptive test names** - Make it clear what each test verifies
4. **Group related tests** - Use describe blocks to organize tests
5. **Test command data separately** - Verify command structure independently
6. **Mock external dependencies** - Isolate unit tests from external services

## Mock Patterns

### Basic Mock Interaction
```javascript
const mockInteraction = {
  deferReply: async () => {},
  editReply: async (content) => {
    // Verify content here
  },
  reply: async (options) => {
    // Verify options here
  },
  client: {
    ws: { ping: 50 }
  }
};
```

### Mock with Assertions
```javascript
const mockInteraction = {
  reply: async (options) => {
    assert.strictEqual(options.content, 'Expected message');
    assert.strictEqual(options.ephemeral, true);
  }
};
```

### Mock External Services
```javascript
const mockGuild = {
  channels: {
    fetch: async (channelId) => {
      if (channelId === 'expected-id') {
        return mockChannel;
      }
      return null;
    }
  }
};
```

## Debugging Tests

### Verbose Output
```bash
node --test --reporter=verbose test/commands/ping.simple.test.js
```

### Debug Specific Test
```bash
node --test --grep="should execute ping command" test/commands/ping.simple.test.js
```

### Add Console Logs
```javascript
test('debug test', async () => {
  console.log('Test starting...');
  const mockInteraction = createMockCommandInteraction();
  console.log('Mock created:', mockInteraction);
  // ... rest of test
});
```

## Current Test Coverage

### Ping Command
- ✅ Command data validation
- ✅ Successful execution
- ✅ Response time calculation
- ✅ WebSocket ping display
- ✅ Error handling

### Report Message Command
- ✅ Command data validation
- ✅ Missing guild handling
- ✅ Missing channel handling
- ✅ Successful report creation
- ✅ Embed structure validation
- ✅ Missing author handling

### Load Commands Utility
- ✅ Command loading
- ✅ Collection initialization
- ✅ Existing command preservation

## Adding New Tests

1. **Create test file** in appropriate directory
2. **Import required modules** (test, assert, command)
3. **Write test cases** following the patterns above
4. **Run tests** to verify they work
5. **Update package.json** if adding new test categories

## Troubleshooting

### Common Issues
- **Import errors**: Make sure to build TypeScript first (`npm run build:ci`)
- **Mock issues**: Use simple mocks instead of complex mocking libraries
- **Async/await**: Always use async/await for command execution tests
- **Assertions**: Use Node.js assert module, not external assertion libraries

### Test Failures
- Check that mocks return the expected values
- Verify async operations are properly awaited
- Ensure test data matches expected command behavior
- Check that error conditions are properly tested
