import { ping } from "./ping.js";
import { reportMessage } from "./reportMessage.js";

export const commands = {
  ping,
  reportMessage: reportMessage,
} as const;
