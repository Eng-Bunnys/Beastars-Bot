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
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  Message,
  hyperlink
} from "discord.js";
import MangaDownloader from "../API/Get Manga";

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
    const mangaId = "f5e3baad-3cd4-427c-a2ec-ad7d776b370d";
    const mangaVersion: number = 3;
    try {
      const mangaDownloader = new MangaDownloader(mangaId, mangaVersion);
      const FetchedManga = await mangaDownloader.downloadMangaChapter(
        message,
        args
      );

      if (FetchedManga.spoiler) {
        return message.reply({
          content: FetchedManga.content,
          files: [FetchedManga.files[0]]
        });
      } else {
        const MainImageEmbed = new EmbedBuilder()
          .setTitle(`${FetchedManga.chapterTitle}`)
          .setDescription(FetchedManga.content)
          .setImage(
            `attachment://${(FetchedManga.files[0] as AttachmentBuilder).name}`
          )
          .setColor(colors.DEFAULT as ColorResolvable);

        const forwardButtons = new ButtonBuilder()
          .setCustomId("mangaGo")
          .setEmoji(`➡️`)
          .setStyle(ButtonStyle.Primary);

        return message.reply({
          embeds: [MainImageEmbed],
          files: [FetchedManga.files[0]]
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
