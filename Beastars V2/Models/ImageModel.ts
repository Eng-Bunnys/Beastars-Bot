import { Snowflake } from "discord.js";
import { Schema, model, Document } from "mongoose";

import crypto from "crypto";

interface IImage {
  name: string;
  imageID: string;
  URL: string;
}

interface IImageData extends Document {
  guildID: string;
  images: IImage[];
}

const ImageSchema = new Schema<IImageData>(
  {
    guildID: { type: String, required: true, unique: true },
    images: [
      {
        name: { type: String, required: true },
        imageID: { type: String, required: true },
        URL: { type: String, required: true },
        _id: false,
      },
    ],
  },
  {
    collection: "Beastars Images",
    strict: true,
  }
);

const ImageModel = model<IImageData>("Beastars Images", ImageSchema);

// Image Handler

class ImageDataHandler {
  private guildID: Snowflake;
  private imageData: IImageData | null = null;

  constructor(guildID: Snowflake) {
    this.guildID = guildID;
  }

  private async ensureInitialized() {
    if (!this.imageData) await this.init();

    if (!this.imageData) throw new Error("Failed to initialize image data");

    return this.imageData;
  }

  public async init() {
    if (!this.imageData) {
      this.imageData = await ImageModel.findOneAndUpdate(
        { guildID: this.guildID },
        { $setOnInsert: { images: [] } },
        { upsert: true, new: true }
      );
    }
    return this.imageData;
  }

  private createImageID(name: string) {
    const baseID = name.toLowerCase().replace(/ /g, "-");
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    return `${baseID}-${uniqueSuffix}`;
  }

  public async addImage(name: string, URL: string) {
    const imageData = await this.ensureInitialized();
    const imageID = this.createImageID(name);
    imageData.images.push({ name, imageID, URL });
    await imageData.save();
    return imageID;
  }

  public async removeImage(imageID: string) {
    const imageData = await this.ensureInitialized();
    imageData.images = imageData.images.filter(
      (image) => image.imageID !== imageID
    );
    await imageData.save();
  }

  public async listImages() {
    const imageData = await this.ensureInitialized();
    return imageData.images
      .map((image) => `${image.name} - ${image.imageID}`)
      .join("\n");
  }

  public async getImage(imageID: string) {
    const imageData = await this.ensureInitialized();
    return imageData.images.find((image) => image.imageID === imageID);
  }
}

export { ImageModel, IImageData, IImage, ImageDataHandler };
