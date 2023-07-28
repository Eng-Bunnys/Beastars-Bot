import {
  AttachmentBuilder,
  hyperlink,
  EmbedBuilder,
  ColorResolvable,
  Message,
  BaseMessageOptions
} from "discord.js";

import { ChannelsModel } from "../schemas/Beasters Schemas/Channels Schema";
import { getChapters, downloadImageByIndex } from "../utils/BeastersEngine";
import { SendAndDelete } from "../utils/Engine";

import colors from "../GBF/GBFColor.json";
import emojis from "../GBF/GBFEmojis.json";
import commands from "../GBF/GBFCommands.json";

class MangaDownloader {
  private readonly mangaId: string;
  private readonly mangaVersion: number;
  constructor(mangaId: string, mangaVersion: number) {
    this.mangaId = mangaId;
    this.mangaVersion = mangaVersion;
  }
  async downloadMangaChapter(
    message: Message,
    args: unknown[]
  ): Promise<
    BaseMessageOptions & {
      allChapters?: any[];
      files?: AttachmentBuilder[];
      spoiler?: boolean;
      chapterTitle?: string;
      maxPages?: number;
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

    if (args.length < 1)
      throw new Error(
        `<@${message.author.id}>, invalid args, the correct usage is {prefix}manga <chapter> <page>`
      );

    interface Chapter {
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

    interface Relationship {
      id: string;
      type: string;
    }

    const allChapters: Chapter[] = await getChapters(
      this.mangaId,
      this.mangaVersion
    );

    function getGroupName(groupId: string): string {
      if (groupId === "97b9cff4-7b84-4fed-929e-1a514be6ca20") return "HCS";
      else if (groupId === "ca84d695-4e0e-48ba-8627-3cbb4f44f95b")
        return "Hybridgumi";
      else return "HCS";
    }

    const targetChapter = Number(args[0]);

    if (Number.isNaN(targetChapter))
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, please input the chapter as a number`
        },
        4
      );

    const targetPage = Number(args[1]);

    if (Number.isNaN(targetPage))
      throw new Error(
        `<@${message.author.id}>, please input the page as a number`
      );

    if (targetChapter > allChapters.length)
      throw new Error(
        `<@${message.author.id}>, invalid chapter, there are only ${allChapters.length} chapters found`
      );

    let isSpoiler = false;

    const targetChapterEntry = allChapters.find((chapter: any) => {
      const chapterNumber = parseFloat(chapter.attributes.chapter);
      return chapterNumber === targetChapter;
    });

    if (!targetChapterEntry)
      throw new Error(
        `<@${message.author.id}>, the specified chapter does not exist`
      );

    const mangaType = getGroupName(targetChapterEntry.relationships[0].id);

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
        description: `Image generated from MangaDex API , code written by .bunnys`
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
        allChapters: allChapters
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
        content: `<@${message.author.id}>`,
        embeds: [ErrorMessage],
        files: undefined
      };
    }
  }
}
export default MangaDownloader;
