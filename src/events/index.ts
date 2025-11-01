import { interactionCreateEvent } from "./interaction-create/index.js";
import { readyEvent } from "./ready/index.js";
import type { DiscordEvent } from "./types.js";

export const events: DiscordEvent[] = [readyEvent, interactionCreateEvent];
