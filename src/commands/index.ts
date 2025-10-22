import { ping } from "./ping/index.js";
import { reportMessage } from "./report-message/index.js";
import type { Command } from "./types.js";

export const commands = new Map<string, Command>(
  [ping, reportMessage].flat().map((command) => [command.data.name, command])
);
