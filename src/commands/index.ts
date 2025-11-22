import { messagesCacheCommand } from "./messages-cache/index.js";
import { ping } from "./ping/index.js";
import { reportMessage } from "./report-message/index.js";
import type { Command } from "./types.js";
import { warn } from "./warn/index.js";

export const commands = new Map<string, Command>(
  [ping, reportMessage, messagesCacheCommand, warn]
    .flat()
    .map((command) => [command.data.name, command])
);
