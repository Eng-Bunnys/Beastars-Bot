import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  GuildMember,
  GuildTextBasedChannel,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand, GBF, ColorCodes, Emojis } from "../../Handler";
import { ChannelWhitelist } from "../../API/Admin/Channel Whitelist";

const ChannelActionEmbed = new EmbedBuilder()
  .setTitle(`${Emojis.Verify} Success`)
  .setColor(ColorCodes.Cyan);

export class ChannelWhitelistCommands extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "channel",
      description: "Admin Channel related commands",
      UserPermissions: [PermissionFlagsBits.Administrator],
      category: "Admin",
      subcommands: {
        whitelist: {
          description: "Whitelist a text channel",
          SubCommandOptions: [
            {
              name: "channel",
              description: "The channel that you want to whitelist",
              type: ApplicationCommandOptionType.Channel,
              channelTypes: [ChannelType.GuildText],
              required: true,
            },
          ],
          async execute({ client, interaction }) {
            const UpdatedChannel = (
              interaction.options as CommandInteractionOptionResolver
            ).getChannel("channel", true) as GuildTextBasedChannel;

            try {
              const BeastarsAPI = new ChannelWhitelist(
                interaction.member as GuildMember,
                interaction.guild
              );

              const Result = await BeastarsAPI.UpdateChannel(
                "Whitelist",
                UpdatedChannel
              );

              ChannelActionEmbed.setDescription(Result);

              return interaction.reply({
                embeds: [ChannelActionEmbed],
              });
            } catch (error) {
              console.log(error);
            }
          },
        },
        blacklist: {
          description: "Remove a channel from the whitelist list",
          SubCommandOptions: [
            {
              name: "channel",
              description: "The channel that you want to remove",
              type: ApplicationCommandOptionType.Channel,
              channelTypes: [ChannelType.GuildText],
              required: true,
            },
          ],
          async execute({ client, interaction }) {
            const UpdatedChannel = (
              interaction.options as CommandInteractionOptionResolver
            ).getChannel("channel", true) as GuildTextBasedChannel;
            try {
              const BeastarsAPI = new ChannelWhitelist(
                interaction.member as GuildMember,
                interaction.guild
              );

              const Result = await BeastarsAPI.UpdateChannel(
                "Blacklist",
                UpdatedChannel
              );

              ChannelActionEmbed.setDescription(Result);

              return interaction.reply({
                embeds: [ChannelActionEmbed],
              });
            } catch (error) {
              console.log(error);
            }
          },
        },
        list: {
          description: "Show all of the whitelisted channels",
          async execute({ client, interaction }) {
            try {
              const BeastarsAPI = new ChannelWhitelist(
                interaction.member as GuildMember,
                interaction.guild
              );

              const WhitelistedChannels =
                await BeastarsAPI.GetWhitelistedChannels();

              const ChannelsEmbed = new EmbedBuilder()
                .setTitle(`💬 Whitelisted Channels`)
                .setDescription(WhitelistedChannels)
                .setColor(ColorCodes.Cyan)
                .setTimestamp();

              return interaction.reply({
                embeds: [ChannelsEmbed],
              });
            } catch (error) {
              console.log(error);
            }
          },
        },
      },
    });
  }
}
