import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type CommandInteractionOptionResolver,
  ComponentType,
  EmbedBuilder,
  type Interaction,
  MessageFlags,
} from "discord.js";
import {
  SlashCommand,
  type GBF,
  ColorCodes,
  messageSplit,
  Emojis,
} from "../../../Handler";
import { BeastarsImage } from "../../../Beastars/Image/ImageHandler";

export class ImageCommands extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "image",
      description: "Add, Remove, or Display Images",
      category: "General",
      cooldown: 5,
      subcommands: {
        add: {
          description: "Add an image to the image list",
          SubCommandOptions: [
            {
              name: "name",
              description: "The name of the image",
              type: ApplicationCommandOptionType.String,
              maxLength: 100,
              required: true,
            },
            {
              name: "url",
              description: "The URL of the image",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
          ],
          async execute({ client, interaction }) {
            const imageName = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("name", true);
            const imageURL = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("url", true);

            try {
              const imageHandler = new BeastarsImage(
                client,
                interaction.user,
                interaction.guild,
                ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
              );
              const imageID = await imageHandler.addImage(imageName, imageURL);

              await interaction.reply({
                content: `Image "${imageName}" added successfully with ID "${imageID}"`,
              });
            } catch (error) {
              await interaction.reply({
                content: `Failed to add image: ${error.message}`,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
        remove: {
          description: "Remove an image from the image list",
          SubCommandOptions: [
            {
              name: "image-id",
              description: "The image's ID",
              type: ApplicationCommandOptionType.String,
              autocomplete: true,
              required: true,
            },
          ],
          async autocomplete(interaction, option) {
            const imageHandler = new BeastarsImage(
              client,
              interaction.user,
              interaction.guild,
              ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
            );
            const imageIDs = await imageHandler.getImageIDs();
            return imageIDs;
          },
          async execute({ client, interaction }) {
            const imageID = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("image-id", true);

            try {
              const imageHandler = new BeastarsImage(
                client,
                interaction.user,
                interaction.guild,
                ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
              );
              await imageHandler.removeImage(imageID);

              await interaction.reply({
                content: `Image "${imageID}" removed successfully`,
              });
            } catch (error) {
              await interaction.reply({
                content: `Failed to remove image: ${error.message}`,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
        get: {
          description: "Get an image",
          SubCommandOptions: [
            {
              name: "image-id",
              description: "The image's ID",
              type: ApplicationCommandOptionType.String,
              autocomplete: true,
            },
          ],
          async autocomplete(interaction, option) {
            const imageHandler = new BeastarsImage(
              client,
              interaction.user,
              interaction.guild,
              ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
            );
            const imageIDs = await imageHandler.getImageIDs();
            return imageIDs;
          },
          async execute({ client, interaction }) {
            const imageID = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("image-id", true);

            try {
              const imageHandler = new BeastarsImage(
                client,
                interaction.user,
                interaction.guild,
                ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
              );
              const imageURL = (await imageHandler.getImageByID(imageID)).URL;

              await interaction.reply({
                files: [imageURL],
              });
            } catch (error) {
              await interaction.reply({
                content: `Failed to get image: ${error.message}`,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
        list: {
          description: "Get a list of all available images",
          async execute({ client, interaction }) {
            try {
              const imageHandler = new BeastarsImage(
                client,
                interaction.user,
                interaction.guild,
                ["1133870182314561536", "1230506952266616895"] // TODO: Get Admin Roles from DB
              );

              const availableImages = (await imageHandler.listImages()).split(
                "\n"
              );

              if (availableImages.length === 0)
                return await interaction.reply({
                  content: "No images available.",
                  flags: MessageFlags.Ephemeral,
                });

              const imagesArray = availableImages.map(
                (image, index) => `**${index + 1}**: ${image}`
              );

              const paginatedPages = messageSplit(imagesArray, 200); // About 3-4 images per page

              const messageEmbeds = paginatedPages.map((pageContent, index) =>
                new EmbedBuilder()
                  .setDescription(pageContent)
                  .setColor(ColorCodes.Default)
                  .setFooter({
                    text: `Page ${index + 1} of ${paginatedPages.length}`,
                  })
                  .setTimestamp()
              );

              const pageTracker = new Map<string, number>();
              const userID = interaction.user.id;
              pageTracker.set(userID, 0);

              const getRow = (
                userID: string
              ): ActionRowBuilder<ButtonBuilder> => {
                const currentPage = pageTracker.get(userID) || 0;

                return new ActionRowBuilder<ButtonBuilder>().addComponents([
                  new ButtonBuilder()
                    .setCustomId("firstPageImage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏪")
                    .setDisabled(currentPage === 0),
                  new ButtonBuilder()
                    .setCustomId("prevEmbedImage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("◀️")
                    .setDisabled(currentPage === 0),
                  new ButtonBuilder()
                    .setCustomId("nextEmbedImage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("▶️")
                    .setDisabled(currentPage === messageEmbeds.length - 1),
                  new ButtonBuilder()
                    .setCustomId("lastPageImage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏩")
                    .setDisabled(currentPage === messageEmbeds.length - 1),
                  new ButtonBuilder()
                    .setCustomId("stopImage")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(Emojis.Error)
                    .setDisabled(false),
                ]);
              };

              await interaction.reply({
                embeds: [messageEmbeds[0]],
                components: [getRow(userID)],
              });

              const filter = (i: Interaction) => i.user.id === userID;

              const collector =
                interaction.channel?.createMessageComponentCollector({
                  filter,
                  componentType: ComponentType.Button,
                  time: 60000,
                });

              collector?.on("collect", async (i: ButtonInteraction) => {
                await i.deferUpdate();

                let currentPage = pageTracker.get(userID) || 0;

                switch (i.customId) {
                  case "stopImage":
                    collector.stop();
                    break;
                  case "nextEmbedImage":
                    currentPage = Math.min(
                      currentPage + 1,
                      messageEmbeds.length - 1
                    );
                    break;
                  case "prevEmbedImage":
                    currentPage = Math.max(currentPage - 1, 0);
                    break;
                  case "firstPageImage":
                    currentPage = 0;
                    break;
                  case "lastPageImage":
                    currentPage = messageEmbeds.length - 1;
                    break;
                }

                pageTracker.set(userID, currentPage);

                await i.editReply({
                  embeds: [messageEmbeds[currentPage]],
                  components: [getRow(userID)],
                });

                collector.resetTimer();
              });

              collector?.on("end", async () => {
                try {
                  const finalPage = pageTracker.get(userID) || 0;

                  pageTracker.delete(userID);

                  const disabledButtons = getRow(userID).components.map(
                    (button) =>
                      ButtonBuilder.from(button as ButtonBuilder).setDisabled(
                        true
                      )
                  );

                  const disabledButtonRow =
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                      disabledButtons
                    );

                  await interaction.editReply({
                    embeds: [messageEmbeds[finalPage]],
                    components: [disabledButtonRow],
                  });
                } catch (error) {
                  await interaction.followUp({
                    content: `Failed to disable buttons: ${error.message}`,
                    flags: MessageFlags.Ephemeral,
                  });
                }
              });
            } catch (error) {
              await interaction.reply({
                content: `Failed to load images: ${error.message}`,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
      },
    });
  }
}
