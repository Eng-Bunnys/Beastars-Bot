import GBFClient from "../handler/clienthandler";
import { CommandOptions, GBFCmd } from "../handler/commandhandler";
import { GBFGuildDataModel } from "../schemas/GBF Schemas/Guild Data Schema";
import Command from "../utils/command";

import { Collection, EmbedBuilder, Message } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
}

export default class LegacyCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "help",
      aliases: ["commands"],
      category: "General",
      usage: `${client.Prefix}help`,
      description: "Shows all of the commands",
      development: true,
      dmEnabled: false
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    const GuildData = await GBFGuildDataModel.findOne({
      guildID: message.guild.id
    });

    let Prefix: string;

    if (GuildData) Prefix = GuildData.Prefix;
    else Prefix = client.Prefix;

    function displayCommands(
      commands: Collection<string, CommandOptions>,
      ignoredCategory?: string[]
    ): string {
      let output = "";
      let isFirstCommand = true;

      commands.forEach((command, key) => {
        if (
          command.category &&
          (!ignoredCategory || !ignoredCategory.includes(command.category))
        ) {
          if (!isFirstCommand)
            output += "==================================================\n";
          output += `\`${command instanceof GBFCmd ? Prefix : "/"}${
            command.name
          }\`\n${command.description}\n${command.usage}\n`;
          isFirstCommand = false;
        }
      });

      return output;
    }

    const HelpMenu = new EmbedBuilder()
      .setTitle(`Help Menu`)
      .setDescription(`${displayCommands(client.commands, ["Developer"])}`)
      .setColor("Blurple");

    return message.reply({
      embeds: [HelpMenu]
    });
  }
}
