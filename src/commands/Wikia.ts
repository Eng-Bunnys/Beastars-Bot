import GBFClient from "../handler/clienthandler";
import { validatePage } from "../utils/BeastersEngine";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import { Message } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: [string];
}

export default class LegacyCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "wiki",
      aliases: ["w"],
      category: "General",
      usage: `${client.Prefix}wiki <query>`,
      description: "Search on the beastars wiki",
      NSFW: false,
      cooldown: 5,
      devBypass: true,
      development: true,
      dmEnabled: false
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    if (!args.length)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, specify what you want to search Eg. ${client.Prefix}wiki [query]`
        },
        4
      );

    let SearchQuery = args.join(" ").toLowerCase();

    const PageValidity = await validatePage(SearchQuery);

    if (!PageValidity)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, invalid search query`
        },
        4
      );

    return message.reply({
      content: PageValidity.toString()
    });
  }
}
