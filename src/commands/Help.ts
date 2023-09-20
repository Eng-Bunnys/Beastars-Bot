import GBFClient from "../handler/clienthandler";
import { CommandOptions, GBFCmd } from "../handler/commandhandler";
import { GBFGuildDataModel } from "../schemas/GBF Schemas/Guild Data Schema";
import Command from "../utils/command";
import colors from "../GBF/GBFColor.json";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  ColorResolvable,
  EmbedBuilder,
  Message
} from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
}

export default class HelpMenu extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "help",
      aliases: ["commands"],
      category: "General",
      usage: `b!help`,
      description: `Shows all of the commands that ${client.user.username} offers`
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
          }${command.aliases.length ? " [" + command.aliases + "]" : ""}\`\n${
            command.description
          }\n${command.usage}\n`;
          isFirstCommand = false;
        }
      });

      return output;
    }

    const HelpMenu = new EmbedBuilder()
      .setTitle(`Help Menu`)
      .setDescription(`${displayCommands(client.commands, ["Developer"])}`)
      .setColor(colors.DEFAULT as ColorResolvable)
      .setFooter({
        text: `${client.user.username} written by .bunnys`
      });

    const MDHelp: ActionRowBuilder<any> = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId("mdHELP")
        .setLabel("Manga Help")
        .setStyle(ButtonStyle.Secondary)
    ]);

    return message.reply({
      embeds: [HelpMenu],
      components: [MDHelp]
    });
  }
}
