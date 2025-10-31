import { messagesCacheCommand } from "./messages-cache/index.js";
import { ping } from "./ping/index.js";
import { reportMessage } from "./report-message/index.js";
import type { Command } from "./types.js";

export const commands = new Map<string, Command>(
  [ping, reportMessage, messagesCacheCommand].flat().map((command) => [command.data.name, command])
);
