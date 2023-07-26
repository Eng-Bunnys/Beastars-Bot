import GBFClient from "../handler/clienthandler";
import { ChannelsModel } from "../schemas/Beasters Schemas/Channels Schema";
import { downloadImageByIndex, getChapters } from "../utils/BeastersEngine";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import colors from "../GBF/GBFColor.json";
import emojis from "../GBF/GBFEmojis.json";
import commands from "../GBF/GBFCommands.json";

import {
  AttachmentBuilder,
  ColorResolvable,
  EmbedBuilder,
  Message,
  hyperlink
} from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
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
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, invalid args, the correct usage is {prefix}manga <chapter> <page>`
        },
        4
      );

    const mangaId = "f5e3baad-3cd4-427c-a2ec-ad7d776b370d";
    const mangaVersion: number = 1;
    const allChapters = await getChapters(mangaId, mangaVersion);

    let mangaType = `Hybridgumi`;
    if (mangaVersion === 3) mangaType = `HCS`;

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
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, please input the page as a number`
        },
        4
      );

    if (targetChapter > allChapters.length)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, invalid chapter, there are only ${allChapters.length} chapters found`
        },
        4
      );

    const targetChapterEntry = allChapters.find((chapter: any) => {
      const chapterNumber = parseFloat(chapter.attributes.chapter);
      return chapterNumber === targetChapter;
    });
    if (!targetChapterEntry)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, the specified chapter does not exist`
        },
        4
      );
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
        name: `${chapterId}_${pageNumber}.png`
      });

      if (
        !GuildData.Channel.length ||
        (GuildData.Channel.length &&
          GuildData.Channel.find((data) => data.ID === message.channel.id)
            ?.Type !== "whitelist")
      ) {
        imageAttachment.setSpoiler(true);
      }

      return message.reply({
        content: hyperlink(
          `Chapter ${targetChapter} | ${pageDownload.message} | ${mangaType}`,
          `<${pageDownload.chapterURL}>`
        ),
        files: [imageAttachment]
      });
    } catch (error) {
      const ErrorMessage = new EmbedBuilder()
        .setTitle(`${emojis.ERROR} I ran into an error`)
        .setColor(colors.ERRORRED as ColorResolvable)
        .setDescription(
          `If the error presisits, please report it to a developer using ${commands.ErrorReport}\n\n\`\`\`ts\n${error}\n\`\`\``
        )
        .setFooter({
          text: `This message auto-deletes in ~ 4 seconds`
        });

      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>`,
          embeds: [ErrorMessage]
        },
        4
      );
    }
  }
}
