import GBFClient from "../handler/clienthandler";
import { ChannelsModel } from "../schemas/Beasters Schemas/Channels Schema";
import {
  downloadImageByIndex,
  getChapterPosition,
  getChapters,
  getNextChapter
} from "../utils/BeastersEngine";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import colors from "../GBF/GBFColor.json";
import emojis from "../GBF/GBFEmojis.json";
import commands from "../GBF/GBFCommands.json";

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
import MangaDownloader from "../API/Get Manga";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: unknown[];
}

export default class GetManagaFromDex extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "manga",
      aliases: ["anime"],
      category: "General",
      description: "Get data from mangadex",
      usage: "b!manga <chapter> <page>",
      cooldown: 5,
      devBypass: true,
      development: false,
      dmEnabled: false
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    const mangaId = "f5e3baad-3cd4-427c-a2ec-ad7d776b370d";
    const mangaVersion: number = 1;
    try {
      const mangaDownloader = new MangaDownloader(mangaId, mangaVersion);
      const FetchedManga = await mangaDownloader.downloadMangaChapter(
        message,
        args as string[]
      );

      let pageNumber = Number(args[1]);
      let chapterNumber = Number(args[0]);

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
          .setCustomId("goManga")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("➡️");

        const backButtons = new ButtonBuilder()
          .setCustomId("backManga")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⬅️");

        const NextChapterButtons = new ButtonBuilder()
          .setCustomId("newChapter")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("⏩")
          .setLabel(`Go to the next chapter`);

        if (pageNumber >= FetchedManga.maxPages)
          forwardButtons.setDisabled(true);
        if (pageNumber <= 1) backButtons.setDisabled(true);

        const PaginationButtons: ActionRowBuilder<any> =
          new ActionRowBuilder().addComponents([backButtons, forwardButtons]);

        if (pageNumber >= FetchedManga.maxPages)
          PaginationButtons.addComponents([NextChapterButtons]);

        const MainMessage = await message.reply({
          embeds: [MainImageEmbed],
          files: [FetchedManga.files[0]],
          components: [PaginationButtons]
        });

        const collector = message.channel.createMessageComponentCollector({
          idle: 30000,
          componentType: ComponentType.Button
        });

        collector.on("collect", async (interaction) => {
          if (interaction.user.id !== message.author.id) {
            interaction.reply({
              content: `<@${interaction.user.id}>, You can't use this button`,
              ephemeral: true
            });
            return;
          }
          const buttonID = interaction.customId;

          if (buttonID === "goManga") pageNumber++;
          else if (buttonID === "backManga") pageNumber--;

          const NewforwardButtons = new ButtonBuilder()
            .setCustomId("goManga")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("➡️");

          const NewbackButtons = new ButtonBuilder()
            .setCustomId("backManga")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⬅️");

          const NextChapterButtons = new ButtonBuilder()
            .setCustomId("newChapter")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⏩")
            .setLabel(`Go to the next chapter`);

          if (buttonID === "backManga" || buttonID === "goManga") {
            let NewFetchedManga = await mangaDownloader.downloadMangaChapter(
              message,
              [chapterNumber, pageNumber]
            );

            const NewButtonsRow: ActionRowBuilder<any> =
              new ActionRowBuilder().addComponents([
                NewbackButtons,
                NewforwardButtons
              ]);

            if (pageNumber >= NewFetchedManga.maxPages) {
              NewforwardButtons.setDisabled(true);
              NewButtonsRow.addComponents([NextChapterButtons]);
            }
            if (pageNumber <= 1) NewbackButtons.setDisabled(true);

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
            const NextChapter = getNextChapter(
              FetchedManga.allChapters,
              chapterNumber.toString()
            );

            chapterNumber = Number(NextChapter.attributes.chapter);

            pageNumber = 1;

            let NewFetchedManga = await mangaDownloader.downloadMangaChapter(
              message,
              [chapterNumber, pageNumber]
            );

            const forwardButtons = new ButtonBuilder()
              .setCustomId("goManga")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️");

            const backButtons = new ButtonBuilder()
              .setCustomId("backManga")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("⬅️")
              .setDisabled(true);

            const FirstPageButtons: ActionRowBuilder<any> =
              new ActionRowBuilder().addComponents([
                backButtons,
                forwardButtons
              ]);

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
          }
        });

        collector.on("end", async (collected, reason) => {
          await MainMessage.edit({
            components: []
          });
        });
      }
    } catch (err) {
      return SendAndDelete(
        message.channel,
        {
          content: `${err}`
        },
        5
      );
    }
  }
}
