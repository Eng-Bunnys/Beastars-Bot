import {
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteractionOptionResolver,
  type GuildMember,
  MessageFlags,
} from "discord.js";
import { SlashCommand, GBF } from "../../../Handler";
import { ChannelWhitelist } from "../../../Beastars/Config/Channel Whitelist";

export class ChannelWhitelistSlash extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "spoiler-channel",
      description: "Set spoiler channels for the server",
      category: "Admin",
      cooldown: 5,
      subcommands: {
        add: {
          description: "The channel to add to the whitelist",
          SubCommandOptions: [
            {
              name: "channel",
              description: "The channel to add to the whitelist",
              type: ApplicationCommandOptionType.Channel,
              channelTypes: [ChannelType.GuildText],
            },
          ],
          async execute({ client, interaction }) {
            const targetChannel = (
              interaction.options as CommandInteractionOptionResolver
            ).getChannel("channel", true);

            try {
              const channelHelper = new ChannelWhitelist(
                interaction.member as GuildMember
              );

              await channelHelper.addChannel(targetChannel.id);

              return interaction.reply({
                content: `Set ${targetChannel} as a spoiler channel`,
              });
            } catch (error) {
              return interaction.reply({
                content: `I ran into an error while trying to set the channel as a spoiler channel.\n\n\`\`\`md\n${error}\`\`\``,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
      },
    });
  }
}
