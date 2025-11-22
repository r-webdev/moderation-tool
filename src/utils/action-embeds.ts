import { EmbedBuilder, type User } from "discord.js";
import type { Action } from "../../generated/prisma/index.js";
import { type ActionReason, ActionStatus, ActionType } from "../../generated/prisma/index.js";

/**
 * Get the color for an action based on its severity
 */
function getActionColor(actionType: ActionType): number {
  switch (actionType) {
    case ActionType.WARN:
    case ActionType.REPEL:
    case ActionType.TIMEOUT:
      return 0xffff00; // Yellow
    case ActionType.MUTE:
    case ActionType.TEMP_MUTE:
    case ActionType.KICK:
      return 0xffa500; // Orange
    case ActionType.BAN:
    case ActionType.TEMP_BAN:
      return 0xff0000; // Red
    case ActionType.REVERT:
      return 0x00ff00; // Green
    default:
      return 0xffa500; // Default to orange
  }
}

/**
 * Format the action reason for display
 */
function formatReason(reason: ActionReason): string {
  return reason
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char: string) => char.toUpperCase());
}

/**
 * Get the emoji for an action type
 */
function getActionEmoji(actionType: ActionType): string {
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

/**
 * Get the action type name for display
 */
function getActionTypeName(actionType: ActionType): string {
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

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format status for display
 */
function formatStatus(status: ActionStatus): string {
  switch (status) {
    case ActionStatus.ACTIVE:
      return "🟢 Active";
    case ActionStatus.STALE:
      return "🟡 Stale";
    case ActionStatus.REVERTED:
      return "🔴 Reverted";
    default:
      return status;
  }
}

/**
 * Create a detailed Discord embed showing all action information (verbose)
 * Used for database lookups and detailed action viewing
 * Note: Action must be fetched with user and moderator relationships included
 */
export function createActionDetails(action: Action, targetUser?: User): EmbedBuilder {
  // Extract Discord user IDs from the action relationships
  const targetUserId = action.user.discordUserId;
  const moderatorUserId = action.moderator.discordUserId;

  // Build title: "action type | reason | status"
  const actionTypeName = getActionTypeName(action.type);
  const reasonText = formatReason(action.reason);
  const statusText = formatStatus(action.status).replace(/🟢 |🟡 |🔴 /, ""); // Remove emoji from title
  const title = `${actionTypeName} | ${reasonText} | ${statusText}`;

  // Build footer text with timestamps and action ID (three rows)
  const createdAt = formatTimestamp(action.createdAt);
  const expiresAt = action.expiresAt ? formatTimestamp(action.expiresAt) : "Never";
  const footerText = `Created: ${createdAt}\nExpires: ${expiresAt}\nAction ID: #${action.actionId}`;

  // Get avatar URL if user object is provided
  const avatarURL = targetUser?.displayAvatarURL();

  const embed = new EmbedBuilder()
    .setColor(getActionColor(action.type))
    .setAuthor({
      name: title,
      iconURL: avatarURL,
    })
    .addFields(
      {
        name: "User",
        value: `<@${targetUserId}> (${targetUserId})`,
        inline: false,
      },
      {
        name: "Moderator",
        value: `<@${moderatorUserId}> (${moderatorUserId})`,
        inline: false,
      },
      {
        name: "Reason",
        value: formatReason(action.reason),
        inline: true,
      }
    )
    .setFooter({ text: footerText });

  // Add note if provided
  if (action.note) {
    embed.addFields({
      name: "Note",
      value: action.note,
      inline: true,
    });
  }

  return embed;
}

interface ActionNotificationOptions {
  user: User;
  actionType: ActionType;
  reason: ActionReason;
}

/**
 * Create a simple action notification embed (short)
 * Just shows "user received a <action type> for <reason>" in one compact line
 */
export function createActionNotification(options: ActionNotificationOptions): EmbedBuilder {
  const { user, actionType, reason } = options;

  const emoji = getActionEmoji(actionType);
  const actionName = getActionTypeName(actionType);
  const formattedReason = formatReason(reason);
  const title = `${emoji} ${user.tag} received a ${actionName} for ${formattedReason}`;

  const embed = new EmbedBuilder()
    .setAuthor({ name: title, iconURL: user.displayAvatarURL() })
    .setColor(getActionColor(actionType));

  return embed;
}
