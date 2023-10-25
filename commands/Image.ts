import GBFClient from "../handler/clienthandler";
import { IImage, ImageModel } from "../schemas/Beastars Schemas/Images Schema";
import { SendAndDelete } from "../utils/Engine";
import Command from "../utils/command";

import { Message, hyperlink } from "discord.js";

interface LegacyCommandExecute {
  client: GBFClient;
  message: Message;
  args: string[];
}

export default class SetImage extends Command {
  constructor(client: GBFClient) {
    super(client, {
      name: "image",
      aliases: ["i"],
      category: "General",
      description: "Add, remove or display images [Admin]",
      usage: "b! image [add/remove] [name] [url]"
    });
  }
  async execute({ client, message, args }: LegacyCommandExecute) {
    const AdminRoles = ["1133870182314561536"];

    const HasRole = AdminRoles.some((roleID) =>
      message.member.roles.cache.some((role) => role.id === roleID)
    );

    if (!HasRole)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, this is an admin only command`
        },
        4
      );

    if (!args.length)
      return SendAndDelete(
        message.channel,
        {
          content: `<@${message.author.id}>, invalid input count, two inputs expected`
        },
        4
      );

    let ImageData = await ImageModel.findOne({
      guildID: message.guildId
    });

    if (!ImageData) {
      ImageData = new ImageModel({
        guildID: message.guildId
      });

      await ImageData.save();
    }

    if (args.length === 1) {
      if (!ImageData.image.length)
        return SendAndDelete(
          message.channel,
          {
            content: `<@${message.author.id}>, no images where found, please use b! image add [url] to add an image`
          },
          6
        );

      const TargetImage = ImageData.image?.find(
        (image) => image.name.toLowerCase() === args[0].toLowerCase()
      );

      if (!TargetImage)
        return SendAndDelete(
          message.channel,
          {
            content: `<@${message.author.id}>, ${args[0]} was not found, you can add it using b! image add [url]`
          },
          6
        );

      return message.channel.send({
        content: `${TargetImage.URL}`
      });
    }

    if (args.length === 2 || args.length === 3) {
      if (
        !(args[0].toLocaleLowerCase() === "add") &&
        !(args[0].toLocaleLowerCase() === "remove")
      )
        return SendAndDelete(
          message.channel,
          {
            content: `<@${message.author.id}>, invalid **first** input, must be either add or remove`
          },
          4
        );

      function isValidImageUrl(url: string): boolean {
        const imageRegex = /\.(jpeg|jpg|png|gif|svg)$/i;
        const discordImageRegex =
          /^https:\/\/cdn.discordapp.com\/attachments\/\d+\/\d+\/.+$/i;

        return imageRegex.test(url) || discordImageRegex.test(url);
      }

      if (args[0].toLocaleLowerCase() === "add") {
        if (!isValidImageUrl(args[2]))
          return SendAndDelete(
            message.channel,
            {
              content: `<@${message.author.id}>, invalid URL in the second input`
            },
            4
          );

        const NewData: IImage = {
          name: args[1],
          URL: args[2]
        };
        ImageData.image.push(NewData);
        await ImageData.save();

        return message.reply({
          content: `Added ${hyperlink(args[1], args[2])}`
        });
      } else if (args[0].toLocaleLowerCase() === "remove") {
        const TargetImage = ImageData.image?.find(
          (image) => image.name.toLowerCase() === args[1].toLowerCase()
        );

        if (!TargetImage)
          return SendAndDelete(
            message.channel,
            {
              content: `<@${message.author.id}>, ${args[1]} was not found, you can add it using b! image add [url]`
            },
            6
          );

        const TargetPosition = ImageData.image.indexOf(TargetImage);

        if (TargetPosition !== -1) ImageData.image.splice(TargetPosition, 1);

        await ImageData.save();

        return message.reply({
          content: `Removed ${args[1]}`
        });
      }
    }
  }
}
