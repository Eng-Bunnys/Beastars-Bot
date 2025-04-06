import {
  BaseMessageOptions,
  DMChannel,
  GuildMember,
  Interaction,
  Message,
  PermissionFlagsBits,
  PermissionResolvable,
  TextBasedChannel,
} from "discord.js";

export function messageSplit(
  message: string | string[],
  maxLength: number,
  separator: string = "\n"
): string[] {
  if (maxLength <= 0 || !Number.isInteger(maxLength))
    throw new Error("Max Length must be a positive integer");

  if (!message) return [];

  const fullMessage: string = Array.isArray(message)
    ? message.join(separator)
    : message;

  if (fullMessage.length <= maxLength) return [fullMessage];

  const result: string[] = [];
  let remainingText = fullMessage;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      result.push(remainingText);
      break;
    }

    let cutIndex = remainingText.lastIndexOf(separator, maxLength);

    if (cutIndex === -1) cutIndex = maxLength;

    result.push(remainingText.substring(0, cutIndex));

    const skipLength = cutIndex === maxLength ? 0 : separator.length;
    remainingText = remainingText.substring(cutIndex + skipLength);
  }

  return result;
}

export function IsValidURL(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function MissingPermissions(
  TargetMember: GuildMember,
  RequiredPermissions: PermissionResolvable | PermissionResolvable[]
) {
  const missingPerms = TargetMember.permissions
    .missing(RequiredPermissions)
    .map(
      (str) =>
        `\`${str
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b(\w)/g, (char) => char.toUpperCase())}\``
    );

  return missingPerms;
}

export async function SendAndDelete(
  Channel: TextBasedChannel,
  MessageOptions: BaseMessageOptions,
  TimeInSeconds = 5
): Promise<Message<false>> {
  if (Channel instanceof DMChannel) return Channel.send(MessageOptions);
  //@ts-ignore
  const message: Message | Interaction = await Channel.send(MessageOptions);

  setTimeout(async () => {
    //@ts-ignore
    await message.delete();
  }, TimeInSeconds * 1000);
}

export function KeyPerms(role: GuildMember) {
  let KeyPermissions = [];
  if (role.permissions.has(PermissionFlagsBits.Administrator))
    return ["Administrator", 1];
  else {
    if (role.permissions.has(PermissionFlagsBits.ManageGuild))
      KeyPermissions.push(`Manage Server`);
    if (role.permissions.has(PermissionFlagsBits.ManageRoles))
      KeyPermissions.push(`Manage Roles`);
    if (role.permissions.has(PermissionFlagsBits.ManageChannels))
      KeyPermissions.push(`Manage Channels`);
    if (role.permissions.has(PermissionFlagsBits.KickMembers))
      KeyPermissions.push(`Kick Members`);
    if (role.permissions.has(PermissionFlagsBits.BanMembers))
      KeyPermissions.push(`Ban Members`);
    if (role.permissions.has(PermissionFlagsBits.ManageNicknames))
      KeyPermissions.push(`Manage Nicknames`);
    if (role.permissions.has(PermissionFlagsBits.ManageGuildExpressions))
      KeyPermissions.push(`Manage Emojis & Stickers`);
    if (role.permissions.has(PermissionFlagsBits.ManageMessages))
      KeyPermissions.push(`Manage Messages`);
    if (role.permissions.has(PermissionFlagsBits.MentionEveryone))
      KeyPermissions.push(`Mention Everyone`);
    if (role.permissions.has(PermissionFlagsBits.ModerateMembers))
      KeyPermissions.push(`Moderate Members`);
  }
  return [KeyPermissions.join(", ") || "No Permissions", KeyPermissions.length];
}
