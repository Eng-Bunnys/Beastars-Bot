import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  type CommandInteraction,
  EmbedBuilder,
  MessageFlags,
  type Snowflake,
} from "discord.js";
import { ColorCodes } from "../Handler";
import { messageSplit, pagination } from "./Utils";

type FromListOptions = {
  interaction: CommandInteraction;
  userID: Snowflake;
  sessionID: string;
  items: string[];
  itemsPerPage?: number;
  title?: string;
  color?: ColorResolvable;
  timeout?: number;
  pageTracker: Map<string, number>;
};

export class PaginatedEmbed {
  static async fromList({
    interaction,
    userID,
    sessionID,
    items,
    itemsPerPage = 10,
    title = "",
    color = ColorCodes.Default,
    timeout = 60000,
    pageTracker,
  }: FromListOptions) {
    if (!items.length)
      return interaction.reply({
        content: "No data to show.",
        flags: MessageFlags.Ephemeral,
      });

    const pages = messageSplit(items, itemsPerPage);
    const embeds = pages.map((content, i) =>
      new EmbedBuilder()
        .setDescription(content)
        .setColor(color)
        .setTimestamp()
        .setFooter({
          text: `Page ${i + 1} of ${pages.length}`,
        })
        .setTitle(title || null)
    );

    const getRow = (userID: Snowflake) => {
      const currentPage = Math.max(
        0,
        Math.min(pageTracker.get(userID) ?? 0, embeds.length - 1)
      );

      return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`firstPage-${sessionID}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⏪")
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId(`prevPage-${sessionID}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("◀️")
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId(`nextPage-${sessionID}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("▶️")
          .setDisabled(currentPage === embeds.length - 1),
        new ButtonBuilder()
          .setCustomId(`lastPage-${sessionID}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⏩")
          .setDisabled(currentPage === embeds.length - 1),
        new ButtonBuilder()
          .setCustomId(`stop-${sessionID}`)
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🛑")
          .setDisabled(false),
      ]);
    };

    await pagination({
      interaction,
      userID,
      messageEmbeds: embeds,
      getRow,
      pageTracker,
      sessionID,
      timeout,
    });
  }
}
