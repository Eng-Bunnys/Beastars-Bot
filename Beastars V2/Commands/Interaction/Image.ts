import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from "discord.js";
import { SlashCommand, GBF } from "../../Handler";
import { BeastarsImage } from "../../Beastars/Image/ImageHandler";

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
      },
    });
  }
}
