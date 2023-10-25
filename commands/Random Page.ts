/**
 * This gets a random page & chapter using the GBF API for beastars
 */

import MangaGetter from "../API/Get Manga";
import GBFClient from "../handler/clienthandler";
import { SendAndDelete } from "../utils/Engine";

import Command from "../utils/command";
const collectors = new Map();

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  ComponentType,
  EmbedBuilder,
  Message
} from "discord.js";

import colors from "../GBF/GBFColor.json";

import {
  findNextChapterNumber,
  groupSwitchable,
  readableGroup
} from "../API/Beastars Engine";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: unknown[];
}

export default class MangaGetterCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "random",
      aliases: ["r"],
      category: "General",
      description: "Get a random page from a specific manga",
      usage: "b! manga [source] <group> [series]",
      cooldown: 5,
      development: true
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    // Expected args => SOURCE group SERIES
    if (args.length < 3)
      return SendAndDelete(
        message.channel,
        {
          content: `Invalid input, enter the correct data, can be found in the help menu`
        },
        5
      );

    args = args.map((element) => {
      if (typeof element === "string") return element.toUpperCase();
      return element;
    });

    // Setting a default value for the page & chapter
    let pageNumber = 1;
    let chapterNumber = 1;
    let source = String(args[0]);
    let group = args.length === 3 ? String(args[1]) : "HCS";
    let series = args.length === 3 ? String(args[2]) : String(args[1]);

    interface IMangaDetails {
      MangaGroup: string;
      MangaSource: string;
      MangaSeries: string;
      page: number;
      chapter: number;
      versionOneMax?: number;
      // For version switching
      versionTwoMax?: number;
    }

    // MangaSettings object
    let MangaSettings: IMangaDetails = {
      page: pageNumber,
      chapter: chapterNumber,
      MangaSource: source,
      MangaGroup: group,
      MangaSeries: series
    };

    // Adding the page and chapter number to args since they're missing at this point, order is irrelevant

    args.push(pageNumber);
    args.push(chapterNumber);

    // Fetching the user specified manga using the default settings

    try {
      let GivenMangaDownloader = new MangaGetter(
        MangaSettings.page,
        MangaSettings.chapter,
        MangaSettings.MangaSeries,
        MangaSettings.MangaSource,
        MangaSettings.MangaGroup,
        false
      );

      let GivenFetchedManga = await GivenMangaDownloader.getPage(
        message,
        false,
        args as string[]
      );

      if (!GivenFetchedManga)
        return SendAndDelete(
          message.channel,
          {
            content: `Invalid input, please refer to the help menu`
          },
          6
        );

      // Getting a random chapter

      const RandomChapter =
        Math.random() * (GivenFetchedManga.allChapters.length - 1) + 1;

      // Getting that chapter then getting it's pages

      MangaSettings.chapter = RandomChapter;

      let ChapterBasedManga = new MangaGetter(
        MangaSettings.page,
        MangaSettings.chapter,
        MangaSettings.MangaSeries,
        MangaSettings.MangaSource,
        MangaSettings.MangaGroup,
        false
      );

      // Getting a random page from that specificed chapter

      let ChapterBasedFetchedManga = await ChapterBasedManga.getPage(
        message,
        false,
        args as string[]
      );

      const RandomPage =
        Math.random() * (ChapterBasedFetchedManga.maxPages - 1) + 1;

      MangaSettings.page = RandomPage;

      // Getting the manga with the random settings

      let mangaDownloader = new MangaGetter(
        MangaSettings.page,
        MangaSettings.chapter,
        MangaSettings.MangaSeries,
        MangaSettings.MangaSource,
        MangaSettings.MangaGroup,
        false
      );

      let FetchedManga = await mangaDownloader.getPage(
        message,
        false,
        args as string[]
      );

      if (!FetchedManga)
        return SendAndDelete(
          message.channel,
          {
            content: `Invalid input, please refer to the help menu`
          },
          6
        );

      MangaSettings.versionOneMax = FetchedManga?.maxPages;

      // Performing the original manga getter sequence like in Manga Legacy.ts

      if (FetchedManga.spoiler) {
        return message.reply({
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
          .setCustomId(`${message.author.id}_goManga`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️");

        const backButtons = new ButtonBuilder()
          .setCustomId(`${message.author.id}_backManga`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️");

        const NextChapterButtons = new ButtonBuilder()
          .setCustomId(`${message.author.id}_newChapter`)
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
            .setCustomId(`${message.author.id}_changeVersion`)
            .setEmoji("ℹ️");

          const switchable = await groupSwitchable(
            otherVersion,
            message,
            MangaSettings.page,
            MangaSettings.chapter,
            MangaSettings.MangaSeries,
            MangaSettings.MangaSource
          );

          if (switchable)
            PaginationButtons.addComponents([changeVersionButtons]);
        }

        const MainMessage = await message.reply({
          embeds: [MainImageEmbed],
          files: [FetchedManga.files[0]],
          components: [PaginationButtons]
        });

        const filter = (i) => i.user.id === message.author.id;

        const collector = message.channel.createMessageComponentCollector({
          filter,
          idle: 30000,
          componentType: ComponentType.Button
        });

        collectors.set(message.author.id, collector);

        collector.on("collect", async (interaction) => {
          if (interaction.user.id !== message.author.id) {
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
            let NewFetchedManga = await mangaDownloader.getPage(message, true, [
              MangaSettings.MangaSource,
              MangaSettings.MangaGroup,
              MangaSettings.MangaSeries,
              MangaSettings.chapter,
              MangaSettings.page
            ]);

            const NewforwardButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const NewbackButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_backManga`)
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
                .setCustomId(`${message.author.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                otherVersion,
                message,
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

            let NewFetchedManga = await mangaDownloader.getPage(message, true, [
              MangaSettings.MangaSource,
              MangaSettings.MangaGroup,
              MangaSettings.MangaSeries,
              MangaSettings.chapter,
              MangaSettings.page
            ]);

            const forwardButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const backButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_backManga`)
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
                .setCustomId(`${message.author.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                otherVersion,
                message,
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
              message,
              false,
              args as string[]
            );

            if (NewFetchedManga.maxPages === undefined)
              NewFetchedManga = await mangaDownloader.getPage(message, true, [
                MangaSettings.MangaSource,
                MangaSettings.MangaGroup,
                MangaSettings.MangaSeries,
                MangaSettings.chapter,
                MangaSettings.versionOneMax
              ]);

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
              .setCustomId(`${message.author.id}_goManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const backButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_backManga`)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️");

            const NextChapterButtons = new ButtonBuilder()
              .setCustomId(`${message.author.id}_newChapter`)
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
                .setCustomId(`${message.author.id}_changeVersion`)
                .setEmoji("ℹ️");

              const switchable = await groupSwitchable(
                oldVersion,
                message,
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
          collectors.delete(message.author.id);
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
      return SendAndDelete(
        message.channel,
        {
          embeds: [ErrorMessageEmbed]
        },
        5
      );
    }
  }
}