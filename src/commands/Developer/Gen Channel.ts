import GBFClient from "../../handler/clienthandler";
import Command from "../../utils/command";

import { ChannelType, Guild, Message, TextChannel } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
}

export default class LegacyCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "gen channels",
      aliases: ["gen"],
      usage: "b!gen",
      category: "Developer",
      description: "Generate channels",
      devOnly: true,
      development: true,
      dmEnabled: false
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    async function createTextChannels(
      guild: Guild,
      channelCount: number,
      channelNamePrefix: string
    ): Promise<TextChannel[]> {
      const createdChannels: TextChannel[] = [];

      for (let i = 0; i < channelCount; i++) {
        const channel = await guild.channels.create({
          name: `${channelNamePrefix}_${i}`,
          type: ChannelType.GuildText,
          topic: `Auto generated channel`
        });
        createdChannels.push(channel);
      }

      return createdChannels;
    }

    if (args.length < 1) return;

    const ChannelCount = args[0];
    if (Number.isNaN(ChannelCount)) return;
    const ChannelPrefix = args[1];

    await createTextChannels(
      message.guild,
      Number(ChannelCount),
      ChannelPrefix
    );
  }
}
