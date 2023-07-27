import GBFClient from "../handler/clienthandler";
import { ChannelsModel } from "../schemas/Beasters Schemas/Channels Schema";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  Message,
  StringSelectMenuBuilder,
  TextChannel
} from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: [string];
}

export default class LegacyCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "spoiler",
      aliases: ["sp"],
      category: "General",
      usage: `${client.Prefix}spoiler whitelist`,
      description: "Manage channels",
      development: true,
      dmEnabled: false
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    if (!args.length)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, specify what you want to do , whitelist / blacklist`
        },
        4
      );

    let GuildData = await ChannelsModel.findOne({
      GuildID: message.guild.id
    });

    if (!GuildData) {
      GuildData = new ChannelsModel({
        GuildID: message.guild.id
      });
      await GuildData.save();
    }

    function getTextChannels(guildId: string): TextChannel[] {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return [];

      const channels = guild.channels.cache.filter(
        (channel) => channel.type === ChannelType.GuildText
      );
      return Array.from(channels.values()) as TextChannel[];
    }

    function splitArray(array: any[], splitIndex: number): [any[], any[]] {
      if (array.length < splitIndex) return [array, []];
      else return [array.slice(0, splitIndex), array.slice(splitIndex)];
    }

    function generateChannelSelectMenu(
      channels: TextChannel[]
    ): [StringSelectMenuBuilder, TextChannel[]] {
      const [slicedArray, restArray] = splitArray(channels, 5);
      const menuOptions = slicedArray.map((channel) => ({
        label: channel.name,
        value: `${args[0].toLowerCase()}_${channel.id}`,
        emoji: GuildData.Channel.length
          ? GuildData.Channel.find((item) => item.ID === channel.id)?.Type ===
            "whitelist"
            ? "✅"
            : GuildData.Channel.find((item) => item.ID === channel.id)?.Type ===
              "blacklist"
            ? "💬"
            : "💬"
          : "💬"
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${message.author.id}_channelSelect`)
        .setPlaceholder("Select a channel")
        .addOptions(menuOptions);

      return [selectMenu, restArray];
    }

    if (
      !args[0].toLocaleLowerCase().includes("whitelist") &&
      !args[0].toLocaleLowerCase().includes("blacklist")
    )
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, invalid args, enter either \`whitelist\` or \`blacklist\``
        },
        4
      );

    const textChannels = getTextChannels(message.guildId);
    const PageLimit = 5;

    const PageCount = Math.ceil(textChannels.length / PageLimit);

    let PageIndex = 0;
    let InitialData = generateChannelSelectMenu(textChannels);
    let ChannelSelectMenu = InitialData[0];
    let RemainingData = InitialData[1];

    const PaginationButtons = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId(`${message.author.id}_prevPage`)
        .setLabel("⬅️ Go back")
        .setDisabled(true)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${message.author.id}_nextPage`)
        .setLabel("Next page ➡️")
        .setStyle(ButtonStyle.Primary)
    ]);

    const ChannelsRow: ActionRowBuilder<any> =
      new ActionRowBuilder().addComponents([ChannelSelectMenu]);

    const PageEmbed = new EmbedBuilder()
      .setDescription(
        `Use the buttons to ${args[0].toLocaleLowerCase()} a text channel`
      )
      .setColor("Blurple");
    PageEmbed.setTitle(`Page 1 / ${PageCount}`);
    const OriginalMessage = await message.channel.send({
      embeds: [PageEmbed],
      components: [ChannelsRow, PaginationButtons]
    });

    const filter = (interaction) =>
      interaction.customId.includes(`${message.author.id}`);

    const collector = message.channel.createMessageComponentCollector({
      filter,
      idle: 30000,
      componentType: ComponentType.Button
    });

    collector.on("collect", async (interaction) => {
      const [user, buttonId] = interaction.customId.split("_");

      if (buttonId === "prevPage" && PageIndex > 0) PageIndex--;
      else if (buttonId === "nextPage" && PageIndex < PageCount - 1)
        PageIndex++;

      const NewGoBack = new ButtonBuilder()
        .setCustomId(`${message.author.id}_prevPage`)
        .setLabel("⬅️ Go back")
        .setStyle(ButtonStyle.Primary);

      const NewForward = new ButtonBuilder()
        .setCustomId(`${message.author.id}_nextPage`)
        .setLabel("Next page ➡️")
        .setStyle(ButtonStyle.Primary);

      if (PageIndex + 1 == PageCount) NewForward.setDisabled(true);
      if (PageIndex == 0) NewGoBack.setDisabled(true);

      const UpdatedPaginationRow: ActionRowBuilder<any> =
        new ActionRowBuilder().addComponents([NewGoBack, NewForward]);

      let NewData = generateChannelSelectMenu(RemainingData);

      if (buttonId === "nextPage" || buttonId === "prevPage") {
        const [NewOptions, newRemainingData] = NewData;

        RemainingData = newRemainingData;

        const ChannelsRow: ActionRowBuilder<any> =
          new ActionRowBuilder().addComponents([NewOptions]);

        PageEmbed.setTitle(`Page ${PageIndex + 1} / ${PageCount}`);

        await OriginalMessage.edit({
          embeds: [PageEmbed],
          components: [ChannelsRow, UpdatedPaginationRow]
        });

        await interaction.reply({
          content: `Page ${PageIndex + 1}`,
          ephemeral: true
        });
      }
    });

    collector.on("end", async (collected, reason) => {
      PageEmbed.setDescription(
        `Command closed to save resources, please re-run the command to continue [30 Seconds idle timer]`
      );
      await OriginalMessage.edit({
        embeds: [PageEmbed],
        components: []
      });
    });
  }
}
