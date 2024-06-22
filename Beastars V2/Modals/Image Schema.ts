import { Schema, Document, model } from "mongoose";

/**
 * @property {string} name The name of the image
 * @property {string} URL The URL to the image
 * @property {string} ID The unique ID given to each image
 * @property {string} Author The user who added the image
 */
interface IIMage {
  name: string;
  URL: string;
  ID: string;
  Author: string;
}

/**
 * @property {string} GuildID The Guild ID Snowflake
 * @property {IIMage[]} Images The array containing the image objects
 */
interface IImageData {
  GuildID: string;
  Images: IIMage[];
}

interface IImageDataDocument extends IImageData, Document {}

const ImageSchema = new Schema<IImageData>(
  {
    GuildID: String,
    Images: [
      {
        name: String,
        ID: String,
        URL: String,
        Author: String,
      },
    ],
  },
  {
    collection: "Beastars Images New",
  }
);

const ImageModel = model<IImageDataDocument>("Beastars Images New", ImageSchema);

export { ImageModel, IIMage, IImageData, IImageDataDocument };
