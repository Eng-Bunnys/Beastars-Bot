import {
  BaseMessageOptions,
  DMChannel,
  GuildMember,
  Interaction,
  Message,
  PermissionFlagsBits,
  PermissionResolvable,
  TextBasedChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ComponentType,
  MessageFlags,
  CommandInteraction,
  Snowflake,
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

export type PaginationOptions = {
  interaction: CommandInteraction;
  userID: Snowflake;
  messageEmbeds: EmbedBuilder[];
  getRow: (
    sessionID: string,
    currentPage: number
  ) => ActionRowBuilder<ButtonBuilder>;
  pageTracker: Map<string, number>;
  timeout?: number;
  sessionID?: string;
  onEnd?: (finalPage: number) => Promise<void> | void;
};

export async function pagination({
  interaction,
  userID,
  messageEmbeds,
  getRow,
  pageTracker,
  timeout = 60000,
  sessionID = userID, // Default to per-user session
  onEnd,
}: PaginationOptions) {
  if (!interaction.channel)
    return interaction.reply({
      content: "Channel not found. Cannot start pagination.",
      flags: MessageFlags.Ephemeral,
    });

  if (pageTracker.has(sessionID))
    return interaction.reply({
      content:
        "You already have an active session. Please finish it before starting a new one.",
      flags: MessageFlags.Ephemeral,
    });

  let currentPage = 0;
  pageTracker.set(sessionID, currentPage);

  try {
    await interaction.reply({
      embeds: [messageEmbeds[currentPage]],
      components: [getRow(sessionID, currentPage)],
    });
  } catch (err) {
    console.error("Initial reply failed:", err);
    pageTracker.delete(sessionID);

    return interaction.followUp({
      content: "Something went wrong while starting pagination.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const filter = (i: ButtonInteraction) => i.user.id === userID;

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: timeout,
  });

  collector.on("collect", async (i: ButtonInteraction) => {
    try {
      switch (i.customId) {
        case `${sessionID}_firstPage`:
          currentPage = 0;
          break;
        case `${sessionID}_prevPage`:
          currentPage = Math.max(currentPage - 1, 0);
          break;
        case `${sessionID}_nextPage`:
          currentPage = Math.min(currentPage + 1, messageEmbeds.length - 1);
          break;
        case `${sessionID}_lastPage`:
          currentPage = messageEmbeds.length - 1;
          break;
        case `${sessionID}_stop`:
          collector.stop();
          return;
      }

      pageTracker.set(sessionID, currentPage);

      await i.deferUpdate();

      await i.editReply({
        embeds: [messageEmbeds[currentPage]],
        components: [getRow(sessionID, currentPage)],
      });

      collector.resetTimer();
    } catch (err) {
      console.error("Error during interaction:", err);
    }
  });

  collector.on("end", async (_collected, reason) => {
    pageTracker.delete(sessionID);
    const finalPage = currentPage;

    if (reason !== "messageDelete") {
      try {
        const disabledRow = getRow(sessionID, finalPage);

        for (const component of disabledRow.components)
          (component as ButtonBuilder).setDisabled(true);

        await interaction.editReply({
          embeds: [messageEmbeds[finalPage]],
          components: [disabledRow],
        });
      } catch (err) {
        console.error("Error disabling buttons:", err);
        try {
          await interaction.followUp({
            content: `I ran into an error while disabling the buttons.\n\`\`\`md\n${err}\`\`\``,
            flags: MessageFlags.Ephemeral,
          });
        } catch (_) {}
      }
    }

    if (onEnd) {
      await onEnd(finalPage);
    }
  });
}
