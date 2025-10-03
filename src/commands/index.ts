import { ping } from "./ping.js";
import type { Command } from "./types.js";

export const commands: Record<string, Command> = {
  ping,
};
