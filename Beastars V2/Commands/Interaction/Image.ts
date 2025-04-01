import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  MessageFlags,
} from "discord.js";
import { SlashCommand, GBF } from "../../Handler";
import { BeastarsImage } from "../../Beastars/ImageHandler";

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
                content: `Image added successfully with ID: ${imageID}`,
                flags: MessageFlags.Ephemeral,
              });
            } catch (error) {
              await interaction.reply({
                content: `Failed to add image: ${error.message}`,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
      },
    });
  }
}
