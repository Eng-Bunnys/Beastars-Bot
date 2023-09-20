import { validatePage } from "../API/Beastars Engine";
import GBFClient from "../handler/clienthandler";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import { Message } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: unknown[];
}

export default class WikiCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "wiki",
      aliases: ["w"],
      category: "General",
      usage: `${client.Prefix}wiki <query>`,
      description: "Search the beastars fandom wiki",
      cooldown: 5
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
