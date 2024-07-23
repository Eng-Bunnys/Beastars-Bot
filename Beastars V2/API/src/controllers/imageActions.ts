import { type Snowflake } from "discord.js";

import { type IImageDataDocument, ImageModel } from "../models/image-schema";
import { AdminModel, IAdminDocument } from "../models/admin-settings";

import { Request, Response } from "express";

let imageData: IImageDataDocument | null = null;
let adminData: IAdminDocument | null = null;

async function validateData(guildID: Snowflake): Promise<void> {
  imageData = await ImageModel.findOne({
    GuildID: guildID,
  }).exec();

  adminData = await AdminModel.findOne({
    GuildID: guildID,
  }).exec();

  if (!imageData)
    imageData = new ImageModel({
      GuildID: guildID,
    });

  if (!adminData)
    adminData = new AdminModel({
      GuildID: guildID,
    });

  if (imageData.isNew) await imageData.save();

  if (adminData.isNew) await adminData.save();
}

// To be used later
function GenerateID(imageName: string): string {
  return imageData
    ? `Image_${imageName.toUpperCase()}_${imageData.Images.length + 1}`
    : "Image_1";
}

// Checks roles function has to be done by the client not server-side

export async function getImage(req: Request, res: Response) {
  const { guildID, imageID, imageName } = req.params;

  if (!guildID)
    return res.status(400).json({
      error: "A guild ID Snowflake is required.",
    });

  await validateData(guildID);

  if (!imageID && !imageName)
    return res.status(400).json({
      error: "Specify an image ID or Name to GET.",
    });

  const foundImage = imageData.Images.find(
    (Image) =>
      (imageID &&
        Image.ID.toLocaleLowerCase() === imageID.toLocaleLowerCase()) ||
      (imageName && imageName.toLocaleLowerCase() === Image.name.toLowerCase())
  );

  if (!foundImage)
    return res.status(404).json({
      message: "The provided image ID or Name does not exist.",
    });

  return res.status(200).json({
    image: foundImage,
  });
}
