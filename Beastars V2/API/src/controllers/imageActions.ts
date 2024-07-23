import { type Snowflake } from "discord.js";
import {
  type IIMage,
  type IImageDataDocument,
  ImageModel,
} from "../models/imageSchema";
import { AdminModel, type IAdminDocument } from "../models/adminSettings";
import { type Request, type Response } from "express";
import { createErrorResponse, createSuccessResponse } from "../utils/utils";

let imageData: IImageDataDocument | null = null;
let adminData: IAdminDocument | null = null;

async function validateData(guildID: Snowflake): Promise<void> {
  imageData = await ImageModel.findOne({ GuildID: guildID }).exec();
  adminData = await AdminModel.findOne({ GuildID: guildID }).exec();

  if (!imageData) {
    imageData = new ImageModel({ GuildID: guildID });
  }

  if (!adminData) {
    adminData = new AdminModel({ GuildID: guildID });
  }

  if (imageData.isNew) await imageData.save();
  if (adminData.isNew) await adminData.save();
}

function GenerateID(imageName: string): string {
  return imageData
    ? `Image_${imageName.toUpperCase()}_${imageData.Images.length + 1}`
    : "Image_1";
}

function findUniqueName(imageName: string): string {
  let uniqueName = imageName.toLocaleLowerCase();
  let counter = 1;

  while (
    imageData?.Images.find(
      (Image: IIMage) => Image.name.toLocaleLowerCase() === uniqueName
    )
  ) {
    uniqueName = `${imageName.toLocaleLowerCase()}_${counter}`;
    counter++;
  }

  return uniqueName;
}

export async function getImage(req: Request, res: Response): Promise<Response> {
  const { guildID, imageID, imageName } = req.params;

  if (!guildID) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "A guild ID Snowflake is required as the first parameter."
        )
      );
  }

  if (!imageID && !imageName) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "Specify an image ID or Name to GET in the second parameter for ID and third for name."
        )
      );
  }

  await validateData(guildID);

  const foundImage = imageData?.Images.find(
    (Image: IIMage) =>
      (imageID &&
        Image.ID.toLocaleLowerCase() === imageID.toLocaleLowerCase()) ||
      (imageName && imageName.toLocaleLowerCase() === Image.name.toLowerCase())
  );

  if (!foundImage) {
    return res
      .status(404)
      .json(
        createErrorResponse("The provided image ID or Name does not exist.")
      );
  }

  return res
    .status(200)
    .json(createSuccessResponse("Image retrieved successfully.", foundImage));
}

export async function addImage(req: Request, res: Response): Promise<Response> {
  const { userID, guildID, imageName, imageURL } = req.params;

  if (!userID) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "A user ID Snowflake must be specified in the first parameter."
        )
      );
  }

  if (!guildID) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "A guild ID Snowflake must be specified in the second parameter."
        )
      );
  }

  if (!imageName) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "The Image Name must be specified in the third parameter."
        )
      );
  }

  if (!imageURL) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          "The Image URL must be specified in the fourth parameter."
        )
      );
  }

  await validateData(guildID);

  const uniqueImageName = findUniqueName(imageName);

  const newImage: IIMage = {
    name: uniqueImageName,
    URL: imageURL,
    ID: GenerateID(uniqueImageName),
    Author: userID,
  };

  imageData?.Images.push(newImage);

  await imageData?.save();

  return res
    .status(200)
    .json(createSuccessResponse("Image added successfully.", newImage));
}
