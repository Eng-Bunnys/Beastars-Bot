import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import {
  MessageCommand,
  type GBF,
  ColorCodes,
  messageSplit,
  Emojis,
  SendAndDelete,
} from "../../Handler";
import { BeastarsImage } from "../../Beastars/Image/ImageHandler";

export class ImageCommandMessage extends MessageCommand {
  constructor(client: GBF) {
    super(client, {
      name: "image",
      description: "Add, Remove, Get, or List Images",
      aliases: ["img"],
      category: "General",
      cooldown: 5,
      usage: `${client.Prefix}image <add/remove/get/list> [arguments]`,
      async execute({ client, message, args }) {
        if (!args.length)
          return SendAndDelete(
            message.channel,
            {
              content:
                "Provide a subcommand: `add`, `remove`, `get`, or `list`.",
            },
            10
          );

        const [subcommand, ...restArgs] = args;
        const sub = subcommand.toLowerCase();

        const imageHandler = new BeastarsImage(
          client,
          message.author,
          message.guild,
          ["1133870182314561536", "1230506952266616895"]
        );

        switch (sub) {
          case "add": {
            const [name, url] = restArgs;

            if (!name || !url)
              return SendAndDelete(
                message.channel,
                {
                  content: "Invalid Syntax\nUsage: `image add <name> <url>`",
                },
                10
              );

            try {
              const id = await imageHandler.addImage(name, url);
              return message.reply(`Image "${name}" added with ID \`${id}\``);
            } catch (err) {
              return SendAndDelete(
                message.channel,
                {
                  content: `Failed to add image, error: ${err.message}`,
                },
                10
              );
            }
          }

          case "remove": {
            const [id] = restArgs;

            if (!id)
              return SendAndDelete(
                message.channel,
                {
                  content: "Invalid Syntax\nUsage: `image remove <image-id>`",
                },
                10
              );

            try {
              await imageHandler.removeImage(id);
              return message.reply({
                content: `Image \`${id}\` removed successfully.`,
              });
            } catch (err) {
              return SendAndDelete(
                message.channel,
                {
                  content: `Failed to remove image, error: ${err.message}`,
                },
                10
              );
            }
          }

          case "get": {
            const [id] = restArgs;

            if (!id)
              return SendAndDelete(
                message.channel,
                { content: "Invalid Syntax\nUsage: `image get <image-id>`" },
                10
              );

            try {
              const { URL } = await imageHandler.getImageByID(id);
              return message.reply({
                files: [URL],
              });
            } catch (err) {
              return SendAndDelete(
                message.channel,
                {
                  content: `Failed to get image, error: ${err.message}`,
                },
                10
              );
            }
          }

          case "list": {
            try {
              const images = (await imageHandler.listImages()).split("\n");

              if (images.length === 0)
                return SendAndDelete(
                  message.channel,
                  {
                    content: "No images found.",
                  },
                  10
                );

              const pages = messageSplit(
                images.map((img, i) => `**${i + 1}**: ${img}`),
                200
              );

              const embeds = pages.map((content, i) =>
                new EmbedBuilder()
                  .setDescription(content)
                  .setColor(ColorCodes.Default)
                  .setFooter({ text: `Page ${i + 1} of ${pages.length}` })
                  .setTimestamp()
              );

              let currentPage = 0;

              const getRow = (): ActionRowBuilder<ButtonBuilder> =>
                new ActionRowBuilder<ButtonBuilder>().addComponents([
                  new ButtonBuilder()
                    .setCustomId("firstPage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏪")
                    .setDisabled(currentPage === 0),
                  new ButtonBuilder()
                    .setCustomId("prevEmbed")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("◀️")
                    .setDisabled(currentPage === 0),
                  new ButtonBuilder()
                    .setCustomId("nextEmbed")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("▶️")
                    .setDisabled(currentPage === embeds.length - 1),
                  new ButtonBuilder()
                    .setCustomId("lastPage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏩")
                    .setDisabled(currentPage === embeds.length - 1),
                  new ButtonBuilder()
                    .setCustomId("stop")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(Emojis.Error),
                ]);

              const msg = await message.reply({
                embeds: [embeds[currentPage]],
                components: [getRow()],
              });

              const collector = msg.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id,
                componentType: ComponentType.Button,
                time: 60000,
              });

              collector.on("collect", async (i) => {
                await i.deferUpdate();
                switch (i.customId) {
                  case "firstPage":
                    currentPage = 0;
                    break;
                  case "prevEmbed":
                    currentPage = Math.max(currentPage - 1, 0);
                    break;
                  case "nextEmbed":
                    currentPage = Math.min(currentPage + 1, embeds.length - 1);
                    break;
                  case "lastPage":
                    currentPage = embeds.length - 1;
                    break;
                  case "stop":
                    collector.stop();
                    break;
                }

                await i.editReply({
                  embeds: [embeds[currentPage]],
                  components: [getRow()],
                });
              });

              collector.on("end", async () => {
                const disabledRow =
                  new ActionRowBuilder<ButtonBuilder>().addComponents(
                    getRow().components.map((btn) =>
                      ButtonBuilder.from(btn as ButtonBuilder).setDisabled(true)
                    )
                  );

                await msg.edit({
                  components: [disabledRow],
                });
              });
            } catch (err) {
              return SendAndDelete(
                message.channel,
                {
                  content: `Failed to list images, error: ${err.message}`,
                },
                10
              );
            }
            break;
          }

          default:
            return SendAndDelete(
              message.channel,
              {
                content:
                  "Invalid subcommand. Use `add`, `remove`, `get`, or `list`.",
              },
              10
            );
        }
      },
    });
  }
}
