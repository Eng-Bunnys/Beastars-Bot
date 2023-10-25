import MangaGetter from "../API/Get Manga";
import GBFClient from "../handler/clienthandler";
import { SendAndDelete } from "../utils/Engine";

const collectors = new Map();

import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  CommandInteraction,
  CommandInteractionOptionResolver,
  ComponentType,
  EmbedBuilder
} from "discord.js";

import colors from "../GBF/GBFColor.json";

import {
  findNextChapterNumber,
  groupSwitchable,
  readableGroup
} from "../API/Beastars Engine";
import SlashCommand from "../utils/slashCommands";

interface IExecute {
  client: GBFClient;
  interaction: CommandInteraction;
}

export default class MangaGetterSlash extends SlashCommand {
  constructor(client: GBFClient) {
    super(client, {
      name: "manga",
      category: "General",
      description: "Get a page from a specific manga",

      options: [
        {
          name: "source",
          description: "The source that you want to get your manga from",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "MangaDex",
              value: "MD"
            },
            {
              name: "Google Drive Back Up",
              value: "G"
            },
            {
              name: "Raw",
              value: "R"
            },
            {
              name: "Viz",
              value: "V"
            }
          ],
          required: true
        },
        {
          name: "series",
          description: "The manga",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Beastars",
              value: "BST"
            },
            {
              name: "Beast Complex",
              value: "BC"
            },
            {
              name: "Paru Graffiti",
              value: "PG"
            }
          ],
          required: true
        },
        {
          name: "chapter",
          description: "The chapter number",
          type: ApplicationCommandOptionType.Number,
          minValue: 1,
          required: true
        },
        {
          name: "page",
          description: "The page number",
          type: ApplicationCommandOptionType.Number,
          minValue: 1,
          required: true
        },
        {
          name: "group",
          description: "The group for Beastars",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Hot Chocolate Scans",
              value: "HCS"
            },
            {
              name: "Hybridgumi",
              value: "HG"
            }
          ]
        }
      ],

      cooldown: 5,
      dmEnabled: false
    });
  }

  async execute({ client, interaction }: IExecute) {
    let pageNumber = (
      interaction.options as CommandInteractionOptionResolver
    ).getNumber("page");
    let chapterNumber = (
      interaction.options as CommandInteractionOptionResolver
    ).getNumber("chapter");
    let source = (
      interaction.options as CommandInteractionOptionResolver
    ).getString("source");
    let group =
      (interaction.options as CommandInteractionOptionResolver).getString(
        "group"
      ) || "HCS";
    let series = (
      interaction.options as CommandInteractionOptionResolver
    ).getString("series");

    let args = [source, group, series, chapterNumber, pageNumber];

    interface IMangaDetails {
      MangaGroup: string;
      MangaSource: string;
      MangaSeries: string;
      page: number;
      chapter: number;
      versionOneMax?: number;
      versionTwoMax?: number;
    }

    let MangaSettings: IMangaDetails = {
      page: pageNumber,
      chapter: chapterNumber,
      MangaSource: source,
      MangaGroup: group,
      MangaSeries: series
    };

    try {
      let mangaDownloader = new MangaGetter(
        MangaSettings.page,
        MangaSettings.chapter,
        MangaSettings.MangaSeries,
        MangaSettings.MangaSource,
        MangaSettings.MangaGroup,
        false
      );

      let FetchedManga = await mangaDownloader.getPage(
        interaction,
        false,
        args
      );

      if (!FetchedManga)
        return interaction.reply({
          content: "Invalid input, please refer to the help menu",
          ephemeral: true
        });

      MangaSettings.versionOneMax = FetchedManga?.maxPages;

      if (FetchedManga.spoiler) {
        return interaction.reply({
          content: FetchedManga.content,
          files: [FetchedManga.files[0]]
        });
      } else {
        const MainImageEmbed = new EmbedBuilder()
          .setTitle(
            `${
              FetchedManga.chapterTitle.length
                ? FetchedManga.chapterTitle
                : "MangaDex Beastars"
            }`
          )
          .setDescription(FetchedManga.content)
          .setImage(
            `attachment://${(FetchedManga.files[0] as AttachmentBuilder).name}`
          )
          .setColor(colors.DEFAULT as ColorResolvable);

        const forwardButtons = new ButtonBuilder()
          .setCustomId(`${interaction.user.id}_goManga`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️");

        const backButtons = new ButtonBuilder()
          .setCustomId(`${interaction.user.id}_backManga`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️");

        const NextChapterButtons = new ButtonBuilder()
          .setCustomId(`${interaction.user.id}_newChapter`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏩")
          .setLabel(`Next chapter`);

        if (MangaSettings.page >= FetchedManga.maxPages)
          forwardButtons.setDisabled(true);
        if (MangaSettings.page <= 1) backButtons.setDisabled(true);

        const PaginationButtons: ActionRowBuilder<any> =
          new ActionRowBuilder().addComponents([backButtons, forwardButtons]);

        if (MangaSettings.page >= FetchedManga.maxPages)
          PaginationButtons.addComponents([NextChapterButtons]);

        const currentVersion = MangaSettings.MangaGroup;

        const otherVersion = currentVersion === "HG" ? "HCS" : "HG";
        if (
          MangaSettings.MangaSource === "MD" ||
          MangaSettings.MangaSource === "G"
        ) {
          const changeVersionButtons = new ButtonBuilder()
            .setLabel(`Change to ${readableGroup(otherVersion)}`)
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`${interaction.user.id}_changeVersion`)
            .setEmoji("ℹ️");

          const switchable = await groupSwitchable(
            otherVersion,
            interaction,
            MangaSettings.page,
            MangaSettings.chapter,
            MangaSettings.MangaSeries,
            MangaSettings.MangaSource
          );

          if (switchable)
            PaginationButtons.addComponents([changeVersionButtons]);
        }

        await interaction.deferReply();

        const MainMessage = await interaction.editReply({
          embeds: [MainImageEmbed],
          files: [FetchedManga.files[0]],
          components: [PaginationButtons]
        });

        const filter = (i) => i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          idle: 30000,
          componentType: ComponentType.Button
        });

        collectors.set(interaction.user.id, collector);

        collector.on("collect", async (interaction) => {
          if (interaction.user.id !== interaction.user.id) {
            interaction.reply({
              content: `<@${interaction.user.id}>, You can't use this button`,
              ephemeral: true
            });
            return;
          }
          const buttonParts = interaction.customId.split("_");
          const buttonID = buttonParts[1];

          if (buttonID === "goManga") MangaSettings.page++;
          else if (buttonID === "backManga") MangaSettings.page--;

          if (buttonID === "backManga" || buttonID === "goManga") {
            let NewFetchedManga = await mangaDownloader.getPage(
              interaction,
              true,
              [
                MangaSettings.MangaSource,
                MangaSettings.MangaGroup,
                MangaSettings.MangaSeries,
                MangaSettings.chapter,
                MangaSettings.page
              ]
            );

            const NewforwardButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const NewbackButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_backManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️");

            const NewButtonsRow: ActionRowBuilder<any> =
              new ActionRowBuilder().addComponents([
                NewbackButtons,
                NewforwardButtons
              ]);

            const currentVersion = MangaSettings.MangaGroup;

            const otherVersion = currentVersion === "HG" ? "HCS" : "HG";
            if (
              MangaSettings.MangaSource === "MD" ||
              MangaSettings.MangaSource === "G"
            ) {
              const changeVersionButtons = new ButtonBuilder()
                .setLabel(`Change to ${readableGroup(otherVersion)}`)
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${interaction.user.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                otherVersion,
                interaction,
                MangaSettings.page,
                MangaSettings.chapter,
                MangaSettings.MangaSeries,
                MangaSettings.MangaSource
              );

              if (switchable)
                NewButtonsRow.addComponents([changeVersionButtons]);
            }

            if (MangaSettings.page >= NewFetchedManga.maxPages) {
              NewforwardButtons.setDisabled(true);
              NewButtonsRow.addComponents([NextChapterButtons]);
            }
            if (MangaSettings.page <= 1) NewbackButtons.setDisabled(true);

            const NewMainImageEmbed = new EmbedBuilder()
              .setTitle(
                `${
                  NewFetchedManga.chapterTitle.length
                    ? NewFetchedManga.chapterTitle
                    : "MangaDex Beastars"
                }`
              )
              .setDescription(NewFetchedManga.content)
              .setImage(
                `attachment://${
                  (NewFetchedManga.files[0] as AttachmentBuilder).name
                }`
              )
              .setColor(colors.DEFAULT as ColorResolvable);

            await MainMessage.edit({
              embeds: [NewMainImageEmbed],
              files: [NewFetchedManga.files[0]],
              components: [NewButtonsRow]
            });
          } else if (buttonID === "newChapter") {
            const nextChapter = findNextChapterNumber(
              FetchedManga.allChapters,
              MangaSettings.chapter
            );

            MangaSettings.chapter = nextChapter;
            MangaSettings.page = 1;

            let NewFetchedManga = await mangaDownloader.getPage(
              interaction,
              true,
              [
                MangaSettings.MangaSource,
                MangaSettings.MangaGroup,
                MangaSettings.MangaSeries,
                MangaSettings.chapter,
                MangaSettings.page
              ]
            );

            const forwardButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const backButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_backManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️")
              .setDisabled(true);

            const FirstPageButtons: ActionRowBuilder<any> =
              new ActionRowBuilder().addComponents([
                backButtons,
                forwardButtons
              ]);

            const currentVersion = MangaSettings.MangaGroup;

            const otherVersion = currentVersion === "HG" ? "HCS" : "HG";
            if (
              MangaSettings.MangaSource === "MD" ||
              MangaSettings.MangaSource === "G"
            ) {
              const changeVersionButtons = new ButtonBuilder()
                .setLabel(`Change to ${readableGroup(otherVersion)}`)
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${interaction.user.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                otherVersion,
                interaction,
                MangaSettings.page,
                MangaSettings.chapter,
                MangaSettings.MangaSeries,
                MangaSettings.MangaSource
              );

              if (switchable)
                FirstPageButtons.addComponents([changeVersionButtons]);
            }

            const NewMainImageEmbed = new EmbedBuilder()
              .setTitle(
                `${
                  NewFetchedManga.chapterTitle.length
                    ? NewFetchedManga.chapterTitle
                    : "MangaDex Beastars"
                }`
              )
              .setDescription(NewFetchedManga.content)
              .setImage(
                `attachment://${
                  (NewFetchedManga.files[0] as AttachmentBuilder).name
                }`
              )
              .setColor(colors.DEFAULT as ColorResolvable);

            await MainMessage.edit({
              embeds: [NewMainImageEmbed],
              files: [NewFetchedManga.files[0]],
              components: [FirstPageButtons]
            });
          } else if (buttonID === "changeVersion") {
            if (MangaSettings.MangaGroup === "HCS")
              MangaSettings.MangaGroup = "HG";
            else if (MangaSettings.MangaGroup === "HG")
              MangaSettings.MangaGroup = "HCS";

            mangaDownloader = new MangaGetter(
              MangaSettings.page,
              MangaSettings.chapter,
              MangaSettings.MangaSeries,
              MangaSettings.MangaSource,
              MangaSettings.MangaGroup,
              false
            );

            let NewFetchedManga = await mangaDownloader.getPage(
              interaction,
              false,
              args as string[]
            );

            if (NewFetchedManga.maxPages === undefined)
              NewFetchedManga = await mangaDownloader.getPage(
                interaction,
                true,
                [
                  MangaSettings.MangaSource,
                  MangaSettings.MangaGroup,
                  MangaSettings.MangaSeries,
                  MangaSettings.chapter,
                  MangaSettings.versionOneMax
                ]
              );

            MangaSettings.versionTwoMax = NewFetchedManga.maxPages;

            const MainImageEmbed = new EmbedBuilder()
              .setTitle(
                `${
                  NewFetchedManga.chapterTitle.length
                    ? FetchedManga.chapterTitle
                    : "MangaDex Beastars"
                }`
              )
              .setDescription(NewFetchedManga.content)
              .setImage(
                `attachment://${
                  (NewFetchedManga.files[0] as AttachmentBuilder).name
                }`
              )
              .setColor(colors.DEFAULT as ColorResolvable);

            const forwardButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const backButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_backManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️");

            const NextChapterButtons = new ButtonBuilder()
              .setCustomId(`${interaction.user.id}_newChapter`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⏩")
              .setLabel(`Next chapter`);

            if (MangaSettings.page >= NewFetchedManga.maxPages)
              forwardButtons.setDisabled(true);
            if (MangaSettings.page <= 1) backButtons.setDisabled(true);

            const PaginationButtons: ActionRowBuilder<any> =
              new ActionRowBuilder().addComponents([
                backButtons,
                forwardButtons
              ]);

            if (MangaSettings.page >= FetchedManga.maxPages)
              PaginationButtons.addComponents([NextChapterButtons]);

            const changedVersion = MangaSettings.MangaGroup;

            const oldVersion = changedVersion === "HG" ? "HCS" : "HG";

            if (
              MangaSettings.MangaSource === "MD" ||
              MangaSettings.MangaSource === "G"
            ) {
              const changeVersionButtons = new ButtonBuilder()
                .setLabel(`Change to ${readableGroup(oldVersion)}`)
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`${interaction.user.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                oldVersion,
                interaction,
                MangaSettings.page,
                MangaSettings.chapter,
                MangaSettings.MangaSeries,
                MangaSettings.MangaSource
              );

              if (switchable)
                PaginationButtons.addComponents([changeVersionButtons]);
            }

            await MainMessage.edit({
              embeds: [MainImageEmbed],
              files: [NewFetchedManga.files[0]],
              components: [PaginationButtons]
            });
          }
        });
        collector.on("end", async (collected, reason) => {
          collectors.delete(interaction.user.id);
          const changeVersionButtons = new ButtonBuilder()
            .setLabel(
              `Change to ${readableGroup(
                MangaSettings.MangaGroup === "HCS" ? "HG" : "HCS"
              )}`
            )
            .setStyle(ButtonStyle.Primary)
            .setCustomId("changeVersion")
            .setEmoji("ℹ️");

          forwardButtons.setDisabled(true);
          backButtons.setDisabled(true);
          NextChapterButtons.setDisabled(true);
          changeVersionButtons.setDisabled(true);
          await MainMessage.edit({
            components: [PaginationButtons]
          });
        });
      }
    } catch (err) {
      const ErrorMessageEmbed = new EmbedBuilder()
        .setTitle(`I ran into an error`)
        .setColor(colors.DEFAULT as ColorResolvable)
        .setDescription(`\`\`\`js\n${err}\`\`\``);
      return interaction.reply({
        embeds: [ErrorMessageEmbed],
        ephemeral: true
      });
    }
  }
}
