import GBFClient from "../handler/clienthandler";
import SlashCommand from "../utils/slashCommands";

import {
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder
} from "discord.js";

import colors from "../GBF/GBFColor.json";
import emojis from "../GBF/GBFEmojis.json";

interface IExecute {
  client: GBFClient;
  interaction: CommandInteraction;
}

export default class BotGuide extends SlashCommand {
  constructor(client: GBFClient) {
    super(client, {
      name: "help",
      description: "Information about the bot",
      category: "General",
      development: true,
      subcommands: {
        general: {
          description: `Information about ${client.user.username}`,
          execute: async ({ client, interaction }: IExecute) => {
            const MainEmbed = new EmbedBuilder()
              .setTitle(`${client.user.username} Discord Bot`)
              .setColor(colors.DEFAULT as ColorResolvable)
              .setDescription(
                `${client.user.username} created by <@333644367539470337> using the GBF Handler, over 24 hours of work were put to create ${client.user.username}`
              )
              .addFields(
                {
                  name: "Features:",
                  value: `${client.user.username} supports many mangas that it gets from MangaDex, you can get specific pages from specific chapters using ${client.user.username} in an instant, ${client.user.username} also features many community commands that helps spark conversations!`
                },
                {
                  name: "Other",
                  value: `Found a bug or want to request a feature, contact <@333644367539470337> or use the contact developer command, you can find how to use it using the help menu b! help`
                }
              );

            return interaction.reply({
              embeds: [MainEmbed],
              ephemeral: true
            });
          }
        },
        beastars: {
          description: `Learn how to use ${client.user.username} to get pages from any beastars manga`,
          execute: async ({ client, interaction }: IExecute) => {
            const MainEmbed = new EmbedBuilder()
              .setTitle(`Beastars`)
              .setColor(colors.DEFAULT as ColorResolvable)
              .setDescription(
                `${client.user.username} has many commands that return Beastars related content, the main one being b! manga, to use b! manga you need to first specifiy the type in the first argument/input, bc means you will get pages from Beastars Complex and bs means you will get from Beastars, D & H mean that you will get the Hybridgumi variant, it defaults to HCS, after setting the type, you will need to specify the chapter number, then the page number. Example\nb! manga bs 46 2, this will return Beastars HCS chapter 46 and page 2`
              );

            return interaction.reply({
              embeds: [MainEmbed],
              ephemeral: true
            });
          }
        },
        "parus-graffiti": {
          description: `Learn how to use ${client.user.username} to get pages from the Paru's Graffiti manga`,
          execute: async ({ client, interaction }: IExecute) => {
            const MainEmbed = new EmbedBuilder()
              .setTitle(`Paru's Graffiti`)
              .setColor(colors.DEFAULT as ColorResolvable)
              .setDescription(
                `To get pages from Paru's Graffiti, use b! pg, the first input will be the chapter number and the second input will be the page number`
              );

            return interaction.reply({
              embeds: [MainEmbed],
              ephemeral: true
            });
          }
        }
      }
    });
  }
}
