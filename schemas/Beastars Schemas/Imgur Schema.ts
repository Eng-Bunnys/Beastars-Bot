import { Schema, model } from "mongoose";

interface IImgurData {
  guildID: string;
  imgurLink: string;
}

const ImageSchema = new Schema<IImgurData>(
  {
    guildID: String,
    imgurLink: {
      type: String,
      default: "https://imgur.com/a/rj0dPcl"
    }
  },
  {
    collection: "Beastars Imgur Data"
  }
);

const ImgurModel = model<IImgurData>("Beastars Imgur Data", ImageSchema);

export { ImgurModel, IImgurData };
