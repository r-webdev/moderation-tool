import { ActionReason, ActionType } from "../../generated/prisma/index.js";

export function getActionColor(actionType: ActionType): number {
  switch (actionType) {
    case ActionType.WARN:
    case ActionType.REPEL:
    case ActionType.TIMEOUT:
      // Yellow
      return 0xffff00;
    case ActionType.MUTE:
    case ActionType.TEMP_MUTE:
    case ActionType.KICK:
      // Orange
      return 0xffa500;
    case ActionType.BAN:
    case ActionType.TEMP_BAN:
      // Red
      return 0xff0000;
    case ActionType.REVERT:
      // Green
      return 0x00ff00;
    default:
      // Default to Orange
      return 0xffa500;
  }
}

export function formatReason(reason: ActionReason): string {
  return reason
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export function getActionEmoji(actionType: ActionType): string {
  switch (actionType) {
    case ActionType.WARN:
      return "⚠️";
    case ActionType.REPEL:
      return "🚫";
    case ActionType.TIMEOUT:
      return "⏱️";
    case ActionType.MUTE:
    case ActionType.TEMP_MUTE:
      return "🔇";
    case ActionType.KICK:
      return "👢";
    case ActionType.BAN:
    case ActionType.TEMP_BAN:
      return "🔨";
    case ActionType.REVERT:
      return "✅";
    default:
      return "📋";
  }
}

export function getActionTypeName(actionType: ActionType): string {
  switch (actionType) {
    case ActionType.WARN:
      return "Warning";
    case ActionType.REPEL:
      return "Repel";
    case ActionType.TIMEOUT:
      return "Timeout";
    case ActionType.MUTE:
      return "Mute";
    case ActionType.TEMP_MUTE:
      return "Temporary Mute";
    case ActionType.KICK:
      return "Kick";
    case ActionType.BAN:
      return "Ban";
    case ActionType.TEMP_BAN:
      return "Temporary Ban";
    case ActionType.REVERT:
      return "Revert";
    default:
      return "Action";
  }
}

export const BAN_TYPE_CHOICES = [
  { name: "Permanent", value: "permanent" },
  { name: "Temporary", value: "temporary" },
];
Object.freeze(BAN_TYPE_CHOICES);

export const REASON_CHOICES = [
  { name: "Spam", value: ActionReason.SPAM },
  { name: "Scam", value: ActionReason.SCAM },
  { name: "Disruptive", value: ActionReason.DISRUPTIVE },
  { name: "NSFW", value: ActionReason.NSFW },
  { name: "Hate Speech", value: ActionReason.HATE_SPEECH },
  { name: "Self Promotion", value: ActionReason.SELF_PROMOTION },
  { name: "Job Posting", value: ActionReason.JOB_POSTING },
  { name: "For Hire", value: ActionReason.FOR_HIRE },
  { name: "Other", value: ActionReason.OTHER },
];
Object.freeze(REASON_CHOICES);
