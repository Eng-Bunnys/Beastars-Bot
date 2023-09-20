import {
  isValidImgurUrl,
  getImgurIdFromUrl,
  getRandomPhotoFromAlbum
} from "../API/Beastars Engine";
import GBFClient from "../handler/clienthandler";
import { ImgurModel } from "../schemas/Beastars Schemas/Imgur Schema";

import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import { Message } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
}

export default class ImgurCommand extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "ooc",
      aliases: ["imgur"],
      category: "General",
      description: "Returns a random image from imgur",
      usage: "b! ooc <imgur link>",
      cooldown: 5
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    let ImgurData = await ImgurModel.findOne({
      guildID: message.guild.id
    });

    if (!ImgurData) {
      ImgurData = new ImgurModel({
        guildID: message.guild.id
      });
      await ImgurData.save();
    }

    if (args.length === 1) {
      if (!isValidImgurUrl(args[0]))
        return SendAndDelete(message.channel, {
          content: `<@${message.author.id}>, invalid imgur URL`
        });
      await ImgurData.updateOne({
        imgurLink: args[0]
      });
      return message.reply({
        content: `Set ${args[0]} to the new imgur link`
      });
    }

    const ID = getImgurIdFromUrl(ImgurData.imgurLink);

    const randomPhoto = await getRandomPhotoFromAlbum(ID);

    return message.reply({
      content: randomPhoto
    });
  }
}
