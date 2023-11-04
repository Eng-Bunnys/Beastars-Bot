import { Schema, model } from "mongoose";

interface IImage {
  name: string;
  URL: string;
}

interface IImageData {
  guildID: string;
  image: IImage[];
}

const ImageSchema = new Schema<IImageData>(
  {
    guildID: String,
    image: [
      {
        name: String,
        URL: String
      }
    ]
  },
  {
    collection: "Beastars Images"
  }
);

const ImageModel = model<IImageData>("Beastars Images", ImageSchema);

export { ImageModel, IImageData, IImage };
