import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteractionOptionResolver,
  ComponentType,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { SlashCommand, GBF, StatusCode, ColorCodes } from "../../Handler";
import { ImageActions } from "../../API/Image Actions";
import { IImageDataDocument, ImageModel } from "../../Modals/Image Schema";

export class SetImageCommand extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "image",
      description: "Add, Remove or display images",
      category: "General",
      development: true,
      subcommands: {
        add: {
          description: "Add an image to the image database",
          SubCommandOptions: [
            {
              name: "name",
              description: "The name of the image",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
            {
              name: "url",
              description: "The url for the image",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
          ],
          async execute({ client, interaction }) {
            const ImageName = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("name", true);
            const ImageURL = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("url", true);

            try {
              const ImageAPI = new ImageActions(
                interaction.member as GuildMember,
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

                return interaction.reply({
                  embeds: [ResponseEmbed],
                });
              } else {
                ResponseEmbed.setDescription(ProcessRequest.message).setTitle(
                  "Failed!"
                );

                return interaction.reply({
                  embeds: [ResponseEmbed],
                });
              }
            } catch (error) {
              return interaction.reply({
                content: error.message,
                ephemeral: true,
              });
            }
          },
        },
        remove: {
          description: "Remove an image from the database",
          SubCommandOptions: [
            {
              name: "image-name",
              description: "The name of the image",
              type: ApplicationCommandOptionType.String,
            },
            {
              name: "image-id",
              description: "The ID of the image",
              type: ApplicationCommandOptionType.String,
            },
          ],
          async execute({ client, interaction }) {
            const options =
              interaction.options as CommandInteractionOptionResolver;
            const ImageName = options.getString("image-name");
            const ImageID = options.getString("image-id");

            if (!ImageName && !ImageID) {
              return await interaction.reply({
                content:
                  "You must provide either an image name or an image ID.",
                ephemeral: true,
              });
            }

            try {
              const ImageAPI = new ImageActions(
                interaction.member as GuildMember,
                ImageName || undefined,
                "Remove",
                undefined,
                ImageID || undefined
              );

              const ProcessRequest = await ImageAPI.RemoveImage();

              const ResponseEmbed = new EmbedBuilder()
                .setColor(ColorCodes.Cyan)
                .setTimestamp();

              if (ProcessRequest.StatusCode === StatusCode.OK) {
                ResponseEmbed.setTitle(`Success!`)
                  .setDescription(ProcessRequest.message)
                  .setImage(ProcessRequest.Image.URL);

                return interaction.reply({
                  embeds: [ResponseEmbed],
                });
              } else {
                ResponseEmbed.setDescription(ProcessRequest.message).setTitle(
                  "Failed!"
                );

                return interaction.reply({
                  embeds: [ResponseEmbed],
                });
              }
            } catch (error) {
              return interaction.reply({
                content: error.message,
                ephemeral: true,
              });
            }
          },
        },
        display: {
          description: "Get an image of your choice!",
          SubCommandOptions: [
            {
              name: "id",
              type: ApplicationCommandOptionType.String,
              description: "The ID of the image that you want to get",
              autocomplete: true,
            },
            {
              name: "name",
              type: ApplicationCommandOptionType.String,
              description: "The name of the image that you want to get",
              autocomplete: true,
            },
          ],
          async autocomplete(interaction, option) {
            const Data: IImageDataDocument[] = await ImageModel.find({});
            if (option === "id")
              return Data.flatMap((Doc) => Doc.Images.map((img) => img.ID));

            if (option === "name")
              return Data.flatMap((Doc) => Doc.Images.map((Img) => Img.name));
          },
          async execute({ client, interaction }) {
            const ImageName = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("name");
            const ImageID = (
              interaction.options as CommandInteractionOptionResolver
            ).getString("id");

            if (!ImageName && !ImageID)
              return interaction.reply({
                content: "Specify either an ID or Name.",
                ephemeral: true,
              });
            try {
              const ImageAPI = new ImageActions(
                interaction.member as GuildMember,
                ImageName || undefined,
                "Get",
                undefined,
                ImageID || undefined
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

                return interaction.reply({
                  embeds: [MessageEmbed],
                });
              } else {
                MessageEmbed.setTitle("Failed!").setDescription(
                  ProcessRequest.message
                );

                return interaction.reply({
                  embeds: [MessageEmbed],
                });
              }
            } catch (error) {
              return interaction.reply({
                content: error.message,
                ephemeral: true,
              });
            }
          },
        },
        list: {
          description: "Show all of the available images",
          async execute({ client, interaction }) {
            const ImageAPI = new ImageActions(
              interaction.member as GuildMember,
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
                    .setCustomId("firstPage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏮")
                    .setDisabled(pages[id] === 0)
                );
                MainButtonsRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId("prevEmbed")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("◀")
                    .setDisabled(pages[id] === 0)
                );
                MainButtonsRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId("nextEmbed")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("▶")
                    .setDisabled(pages[id] === Embeds.length - 1)
                );
                MainButtonsRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId("finalPage")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("⏭")
                    .setDisabled(pages[id] === Embeds.length - 1)
                );
                MainButtonsRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId("end")
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Close")
                    .setEmoji("🚫")
                    .setDisabled(false)
                );
                return MainButtonsRow;
              };

              let id = interaction.user.id;

              pages[id] = pages[id] || 0;

              const Embed = Embeds[pages[id]];

              await interaction.reply({
                embeds: [Embed],
                components: [GetRow(id)],
              });

              const filter = (i: ButtonInteraction) => {
                return i.user.id === interaction.user.id;
              };

              const collector =
                interaction.channel.createMessageComponentCollector({
                  filter,
                  componentType: ComponentType.Button,
                  idle: 15000,
                });

              collector.on("collect", async (i) => {
                await i.deferUpdate();

                if (i.customId === "prevEmbed") {
                  pages[id]--;
                  if (pages[id] < 0) pages[id] = 0;
                  await interaction.editReply({
                    embeds: [Embeds[pages[id]]],
                    components: [GetRow(id)],
                  });
                } else if (i.customId === "nextEmbed") {
                  pages[id]++;
                  if (pages[id] > Embeds.length - 1)
                    pages[id] = Embeds.length - 1;
                  await interaction.editReply({
                    embeds: [Embeds[pages[id]]],
                    components: [GetRow(id)],
                  });
                } else if (i.customId === "end") {
                  collector.stop();
                } else if (i.customId === "firstPage") {
                  pages[id] = 0;
                  await interaction.editReply({
                    embeds: [Embeds[pages[id]]],
                    components: [GetRow(id)],
                  });
                } else if (i.customId === "finalPage") {
                  pages[id] = Embeds.length - 1;
                  await interaction.editReply({
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

                await interaction.editReply({
                  components: [MainButtonsRowDisabled],
                });
              });
            } else {
              return interaction.reply({
                content: ProcessRequest.message,
                ephemeral: true,
              });
            }
          },
        },
      },
    });
  }
}
