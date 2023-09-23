/**
 * Get Manga
 * Written by .bunnys => 333644367539470337
 * Need help? Support Server: https://discord.gg/yrM7fhgNBW
 * GBF Bot: https://discord.com/api/oauth2/authorize?client_id=795361755223556116&permissions=1642787765494&scope=bot%20applications.commands
 
  Beastars Bot written under GBF

  The main logic behind Beastar Bot's manga get function 
*/

import {
  AttachmentBuilder,
  BaseMessageOptions,
  ButtonInteraction,
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  Message,
  hyperlink
} from "discord.js";
import { ChannelsModel } from "../schemas/Beastars Schemas/Channels Schema";
import {
  downloadImageByIndex,
  getChapters,
  getGroupName,
  getMangaVersion,
  getSeriesID,
  readableGroup
} from "./Beastars Engine";

import {
  downloadPage,
  getFilesFromChapter,
  getFolders
} from "../API/Drive Logic";

import colors from "../GBF/GBFColor.json";
import emojis from "../GBF/GBFEmojis.json";
import commands from "../GBF/GBFCommands.json";
import { client } from "..";
import { DriveLinksNames } from "./Drive Links";

export interface Relationship {
  id: string;
  type: string;
}

export interface Chapter {
  id: string;
  type: string;
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: Date;
    readableAt: Date;
    createdAt: Date;
    updatedAt: Date;
    pages: number;
    version: number;
  };
  relationships: Relationship[];
}

class MangaGetter {
  private readonly page: number;
  private readonly chapter: number;
  private readonly series: string;
  private readonly source: string;
  private readonly group?: string;
  private readonly useArgs?: boolean;
  constructor(
    page: number,
    chapter: number,
    series: string,
    source: string,
    group?: string,
    useArgs?: boolean
  ) {
    this.page = page;
    this.chapter = chapter;
    this.series = series;
    this.source = source.toUpperCase();
    this.group = group ? group : "HCS";
    this.useArgs = useArgs ? useArgs : false;
  }
  async getPage(
    message: Message | CommandInteraction | ButtonInteraction,
    useArgs?: boolean,
    args?: unknown[]
  ): Promise<
    BaseMessageOptions & {
      allChapters?: any[];
      files?: AttachmentBuilder[];
      spoiler?: boolean;
      chapterTitle?: string;
      maxPages?: number;
      relations?: Relationship[] | string | null;
    }
  > {
    let GuildData = await ChannelsModel.findOne({
      GuildID: message.guild.id
    });

    if (!GuildData) {
      GuildData = new ChannelsModel({
        GuildID: message.guild.id
      });
      await GuildData.save();
    }

    const userMention =
      message instanceof Message
        ? `<@${message.author.username}>`
        : `<@${message.user.username}>`;

    if (message instanceof Message && args && args.length < 4)
      throw new Error(
        `${userMention}, Invalid input count, please enter a minimum of 4 inputs separated by spaces`
      );
    let PageNumber: number;
    let ChapterNumber: number;

    if (useArgs) {
      PageNumber = args.length === 5 ? Number(args[4]) : Number(args[3]);
      ChapterNumber = args.length === 5 ? Number(args[3]) : Number(args[2]);
    } else {
      PageNumber = this.page;
      ChapterNumber = this.chapter;
    }

    let isSpoiler = false;

    const targetPage = Number(PageNumber);
    const targetChapter = Number(ChapterNumber);

    if (this.source !== "MD") {
      //Viz Drive
      if (this.source === "V") {
        let url: string;
        if (this.series === "BST") url = DriveLinksNames["Viz  Beastars"];
        if (this.series === "BC") url = DriveLinksNames["Viz  Beast complex"];
        else if (this.series !== "BST" && this.series !== "BC")
          throw new Error("Invalid series, please enter BST or BC");

        const AllFolders = await getFolders(url);
        const AllPages = await getFilesFromChapter(ChapterNumber, url);
        const DownloadedPage = await downloadPage(
          ChapterNumber,
          PageNumber,
          `${this.source}_${this.series}_${this.group}_${ChapterNumber}${PageNumber}`,
          url
        );

        const imageAttachment = new AttachmentBuilder(DownloadedPage, {
          name: `${this.series}_${this.source}_${ChapterNumber}${PageNumber}.png`,
          description: `${client.user.username} written by .bunnys`
        });

        if (
          !GuildData.Channel.length ||
          (GuildData.Channel.length &&
            GuildData.Channel.find((data) => data.ID === message.channel.id)
              ?.Type !== "whitelist")
        ) {
          imageAttachment.setSpoiler(true);
          isSpoiler = true;
        }

        return {
          content: `Viz`,
          files: [imageAttachment],
          spoiler: isSpoiler,
          chapterTitle: `Ch. ${ChapterNumber} | ${PageNumber}/${AllPages.length}`,
          maxPages: AllPages.length,
          allChapters: AllFolders,
          relations: null
        };

        // Google Drive Back Up
      } else if (this.source === "G") {
        let url: string;
        if (!this.group) {
          if (this.series === "BST") url = DriveLinksNames["HCS  Beastars"];
          if (this.series === "BC") url = DriveLinksNames["HCS Beast Complex"];
        } else if (this.group && this.group === "HCS") {
          if (this.series === "BST") url = DriveLinksNames["HCS  Beastars"];
          if (this.series === "BC") url = DriveLinksNames["HCS Beast Complex"];
        } else if (this.group && this.group === "HG") {
          if (this.series === "BST")
            url = DriveLinksNames["Hybridgumi Beastars"];
          if (this.series === "BC")
            url = DriveLinksNames["Hybridgumi Beast Complex"];
        } else throw new Error("Invalid series or group");

        const AllFolders = await getFolders(url);

        const AllPages = await getFilesFromChapter(ChapterNumber, url);

        const DownloadedPage = await downloadPage(
          ChapterNumber,
          PageNumber,
          `${this.source}_${this.series}_${this.group}_${ChapterNumber}${PageNumber}`,
          url
        );

        const imageAttachment = new AttachmentBuilder(DownloadedPage, {
          name: `${this.series}_${this.source}_${ChapterNumber}${PageNumber}.png`,
          description: `${client.user.username} written by .bunnys`
        });

        if (
          !GuildData.Channel.length ||
          (GuildData.Channel.length &&
            GuildData.Channel.find((data) => data.ID === message.channel.id)
              ?.Type !== "whitelist")
        ) {
          imageAttachment.setSpoiler(true);
          isSpoiler = true;
        }

        return {
          content: `${readableGroup(this.group)}`,
          files: [imageAttachment],
          spoiler: isSpoiler,
          chapterTitle: `Ch. ${ChapterNumber} | ${PageNumber}/${AllPages.length}`,
          maxPages: AllPages.length,
          allChapters: AllFolders,
          relations: null
        };

        // Raw
      } else if (this.source === "R") {
        let url: string;
        if (this.series === "BST") url = DriveLinksNames["Raw Beastars"];
        if (this.series === "BC") url = DriveLinksNames["Raw Beast Complex"];
        else if (this.series !== "BST" && this.series !== "BC")
          throw new Error("Invalid series, please enter BST or BC");

        const AllFolders = await getFolders(url);
        const AllPages = await getFilesFromChapter(ChapterNumber, url);
        const DownloadedPage = await downloadPage(
          ChapterNumber,
          PageNumber,
          `${this.source}_${this.series}_${this.group}_${ChapterNumber}${PageNumber}`,
          url
        );

        const imageAttachment = new AttachmentBuilder(DownloadedPage, {
          name: `${this.series}_${this.source}_${ChapterNumber}${PageNumber}.png`,
          description: `${client.user.username} written by .bunnys`
        });

        if (
          !GuildData.Channel.length ||
          (GuildData.Channel.length &&
            GuildData.Channel.find((data) => data.ID === message.channel.id)
              ?.Type !== "whitelist")
        ) {
          imageAttachment.setSpoiler(true);
          isSpoiler = true;
        }

        return {
          content: `Raw`,
          files: [imageAttachment],
          spoiler: isSpoiler,
          chapterTitle: `Ch. ${ChapterNumber} | ${PageNumber}/${AllPages.length}`,
          maxPages: AllPages.length,
          allChapters: AllFolders,
          relations: null
        };
      }

      // MangaDex Fetch
    } else if (this.source === "MD") {
      const mangaID = getSeriesID(this.series);
      let mangaVersion: string | null;
      if (
        mangaID !== "f5e3baad-3cd4-427c-a2ec-ad7d776b370d" &&
        mangaID !== "cd9b65e3-b9e2-4d8b-b9dd-0bc8be59f312"
      )
        mangaVersion = null;
      else mangaVersion = getMangaVersion(this.group ? this.group : "HCS");

      const allChapters: Chapter[] = await getChapters(mangaID, mangaVersion);

      const targetChapterEntry: Chapter = allChapters.find(
        (chapter: Chapter) => {
          const chapterNumber = parseFloat(chapter.attributes.chapter);
          return chapterNumber === targetChapter;
        }
      );

      if (!targetChapterEntry)
        throw new Error(`${userMention}, the specified chapter does not exist`);

      let mangaType: string;
      if (
        mangaID !== "f5e3baad-3cd4-427c-a2ec-ad7d776b370d" &&
        mangaID !== "cd9b65e3-b9e2-4d8b-b9dd-0bc8be59f312"
      )
        mangaType = `${this.series}`;
      else mangaType = getGroupName(targetChapterEntry.relationships[0].id);

      const chapterTitle = targetChapterEntry.attributes.title;

      const chapterId = targetChapterEntry.id;

      const pageNumber = targetPage - 1;
      const quality = "data";
      const savePath = "./images";

      try {
        const pageDownload = await downloadImageByIndex(
          chapterId,
          pageNumber,
          quality,
          savePath
        );

        const imageAttachment = new AttachmentBuilder(pageDownload.filePath, {
          name: `${chapterId}_${pageNumber}.png`,
          description: `${client.user.username} written by .bunnys`
        });

        if (
          !GuildData.Channel.length ||
          (GuildData.Channel.length &&
            GuildData.Channel.find((data) => data.ID === message.channel.id)
              ?.Type !== "whitelist")
        ) {
          imageAttachment.setSpoiler(true);
          isSpoiler = true;
        }

        return {
          content: hyperlink(
            `Chapter ${targetChapter} | ${pageDownload.message} | ${mangaType}`,
            `<${pageDownload.chapterURL}>`
          ),
          files: [imageAttachment],
          spoiler: isSpoiler,
          chapterTitle: chapterTitle,
          maxPages: pageDownload.maxFiles,
          allChapters: allChapters,
          relations: targetChapterEntry.relationships
        };
      } catch (error) {
        const ErrorMessage = new EmbedBuilder()
          .setTitle(`${emojis.ERROR} I ran into an error`)
          .setColor(colors.ERRORRED as ColorResolvable)
          .setDescription(
            `If the error persists, please report it to a developer using ${commands.ErrorReport}\n\n\`\`\`ts\n${error}\n\`\`\``
          )
          .setFooter({
            text: `This message auto-deletes in ~ 4 seconds`
          });

        return {
          content: `${userMention}`,
          embeds: [ErrorMessage],
          files: undefined
        };
      }
    }
  }
}

export default MangaGetter;
