import { rules } from "./rules-config.js";

export const MAX_RULE_TIMEFRAME = Math.max(
  ...rules.filter((rule) => rule.type !== "contentBased").map((rule) => rule.timeframe)
);
