import {
  GuildMember,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
} from "discord.js";
import { ImageActions } from "../../API/Image Actions";
import {
  MessageCommand,
  GBF,
  SendAndDelete,
  ColorCodes,
  StatusCode,
} from "../../Handler";

export class MessageCommandTemplate extends MessageCommand {
  constructor(client: GBF) {
    super(client, {
      name: "image",
      description: "Add, Remove or display images",
      aliases: ["i"],
      category: "General",
      cooldown: 5,
      usage: `${client.Prefix} image [add/remove/list/display] <name/id> <name/id> <url>`,
      async execute({ client, message, args }) {
        if (!args.length)
          return SendAndDelete(
            message.channel,
            {
              content: `<@${message.author.id}>, invalid input, please refer to the help menu.`,
            },
            4
          );

        if (args[0].toLocaleLowerCase() === "list") {
          const ImageAPI = new ImageActions(
            message.member as GuildMember,
            undefined,
            "List",
            undefined,
            undefined
          );

          const ProcessRequest = await ImageAPI.ListImages();

          if (ProcessRequest.StatusCode === StatusCode.OK) {
            const Embeds = [];
            const pages = {};

            for (let i = 0; i < ProcessRequest.Images.length; i++) {
              let PageNumber = i + 1;

              Embeds.push(
                new EmbedBuilder()
                  .setDescription(
                    `${ProcessRequest.Images[PageNumber - 1].join("\n")}`
                  )
                  .setColor(ColorCodes.Cyan)
                  .setFooter({
                    text: `Page ${PageNumber} / ${ProcessRequest.Images.length}`,
                  })
              );
            }

            const GetRow = (id) => {
              const MainButtonsRow: ActionRowBuilder<ButtonBuilder> =
                new ActionRowBuilder<ButtonBuilder>();
              MainButtonsRow.addComponents(
                new ButtonBuilder()
                  .setCustomId("firstPageM")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⏮")
                  .setDisabled(pages[id] === 0)
              );
              MainButtonsRow.addComponents(
                new ButtonBuilder()
                  .setCustomId("prevEmbedM")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("◀")
                  .setDisabled(pages[id] === 0)
              );
              MainButtonsRow.addComponents(
                new ButtonBuilder()
                  .setCustomId("nextEmbedM")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("▶")
                  .setDisabled(pages[id] === Embeds.length - 1)
              );
              MainButtonsRow.addComponents(
                new ButtonBuilder()
                  .setCustomId("finalPageM")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⏭")
                  .setDisabled(pages[id] === Embeds.length - 1)
              );
              MainButtonsRow.addComponents(
                new ButtonBuilder()
                  .setCustomId("endM")
                  .setStyle(ButtonStyle.Danger)
                  .setLabel("Close")
                  .setEmoji("🚫")
                  .setDisabled(false)
              );
              return MainButtonsRow;
            };

            let id = message.author.id;

            pages[id] = pages[id] || 0;

            const Embed = Embeds[pages[id]];

            const OriginalMessage = await message.reply({
              embeds: [Embed],
              components: [GetRow(id)],
            });

            const filter = (i: ButtonInteraction) => {
              return i.user.id === message.author.id;
            };

            const collector = message.channel.createMessageComponentCollector({
              filter,
              componentType: ComponentType.Button,
              idle: 15000,
            });

            collector.on("collect", async (i) => {
              await i.deferUpdate();

              if (i.customId === "prevEmbedM") {
                pages[id]--;
                if (pages[id] < 0) pages[id] = 0;
                await OriginalMessage.edit({
                  embeds: [Embeds[pages[id]]],
                  components: [GetRow(id)],
                });
              } else if (i.customId === "nextEmbedM") {
                pages[id]++;
                if (pages[id] > Embeds.length - 1)
                  pages[id] = Embeds.length - 1;
                await OriginalMessage.edit({
                  embeds: [Embeds[pages[id]]],
                  components: [GetRow(id)],
                });
              } else if (i.customId === "endM") {
                collector.stop();
              } else if (i.customId === "firstPageM") {
                pages[id] = 0;
                await OriginalMessage.edit({
                  embeds: [Embeds[pages[id]]],
                  components: [GetRow(id)],
                });
              } else if (i.customId === "finalPageM") {
                pages[id] = Embeds.length - 1;
                await OriginalMessage.edit({
                  embeds: [Embeds[pages[id]]],
                  components: [GetRow(id)],
                });
              }
            });

            collector.on("end", async (i) => {
              const MainButtonsRowDisabled: ActionRowBuilder<any> =
                new ActionRowBuilder();
              MainButtonsRowDisabled.addComponents(
                new ButtonBuilder()
                  .setCustomId("prev_embedD")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⏮")
                  .setDisabled(true)
              );
              MainButtonsRowDisabled.addComponents(
                new ButtonBuilder()
                  .setCustomId("next_embedD")
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⏭")
                  .setDisabled(true)
              );

              await OriginalMessage.edit({
                components: [MainButtonsRowDisabled],
              });
            });
          } else {
            return SendAndDelete(
              message.channel,
              {
                content: ProcessRequest.message,
              },
              4
            );
          }
        } else if (args[0].toLocaleLowerCase() === "remove") {
          if (args.length !== 2)
            return SendAndDelete(
              message.channel,
              {
                content: `<@${message.author.id}>, invalid input, enter the ID or name of the image that you want to remove.`,
              },
              4
            );

          try {
            const ImageAPI = new ImageActions(
              message.member as GuildMember,
              args[1] || undefined,
              "Remove",
              undefined,
              args[1] || undefined
            );

            const ProcessRequest = await ImageAPI.RemoveImage();

            const ResponseEmbed = new EmbedBuilder()
              .setColor(ColorCodes.Cyan)
              .setTimestamp();

            if (ProcessRequest.StatusCode === StatusCode.OK) {
              ResponseEmbed.setTitle(`Success!`)
                .setDescription(ProcessRequest.message)
                .setImage(ProcessRequest.Image.URL);

              return message.reply({
                embeds: [ResponseEmbed],
              });
            } else {
              ResponseEmbed.setDescription(ProcessRequest.message).setTitle(
                "Failed!"
              );

              return message.reply({
                embeds: [ResponseEmbed],
              });
            }
          } catch (error) {
            return SendAndDelete(
              message.channel,
              {
                content: error.message,
              },
              4
            );
          }
        } else if (args[0].toLocaleLowerCase() === "add") {
          if (args.length !== 3)
            return SendAndDelete(message.channel, {
              content: `<@${message.author.id}>, invalid input, expected name and URL respectively`,
            });

          const ImageName = args[1];
          const ImageURL = args[2];

          try {
            const ImageAPI = new ImageActions(
              message.member as GuildMember,
              ImageName,
              "Add",
              ImageURL
            );

            const ProcessRequest = await ImageAPI.AddImage();

            const ResponseEmbed = new EmbedBuilder()
              .setColor(ColorCodes.Cyan)
              .setTimestamp();

            if (ProcessRequest.StatusCode === StatusCode.OK) {
              ResponseEmbed.setTitle(`Success!`)
                .setDescription(ProcessRequest.message)
                .setImage(ProcessRequest.Image.URL);

              return message.reply({
                embeds: [ResponseEmbed],
              });
            } else {
              ResponseEmbed.setDescription(ProcessRequest.message).setTitle(
                "Failed!"
              );

              return message.reply({
                embeds: [ResponseEmbed],
              });
            }
          } catch (error) {
            return SendAndDelete(
              message.channel,
              {
                content: error.message,
              },
              4
            );
          }
        } else if (args[0].toLocaleLowerCase() === "display") {
          if (args.length !== 2)
            return SendAndDelete(
              message.channel,
              {
                content: `<@${message.author.id}>, invalid input, expected an ID or image name.`,
              },
              4
            );

          const ImageData = args[1];

          try {
            const ImageAPI = new ImageActions(
              message.member as GuildMember,
              ImageData || undefined,
              "Get",
              undefined,
              ImageData || undefined
            );

            const ProcessRequest = await ImageAPI.GetImage();

            const MessageEmbed = new EmbedBuilder()
              .setColor(ColorCodes.Cyan)
              .setTimestamp();

            if (ProcessRequest.StatusCode === StatusCode.OK) {
              MessageEmbed.setTitle(ProcessRequest.Image.name)
                .setDescription(
                  `Image Author ID: ${ProcessRequest.Image.ID} | Image ID: ${ProcessRequest.Image.ID}`
                )
                .setImage(ProcessRequest.Image.URL);

              return message.reply({
                embeds: [MessageEmbed],
              });
            } else {
              MessageEmbed.setTitle("Failed!").setDescription(
                ProcessRequest.message
              );

              return message.reply({
                embeds: [MessageEmbed],
              });
            }
          } catch (error) {
            return SendAndDelete(
              message.channel,
              {
                content: error.message,
              },
              4
            );
          }
        }
      },
    });
  }
}
