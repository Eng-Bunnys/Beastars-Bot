import { type Snowflake, type GuildMember, type Role } from "discord.js";

import {
  type IIMage,
  type IImageDataDocument,
  ImageModel,
} from "../Modals/Image Schema";

type TAction = "Add" | "Remove" | "Get";

export class ImageActions {
  public readonly CommandAuthor: GuildMember;
  public readonly AuthorizedRoles: Snowflake[];

  public readonly ImageName: string;
  public readonly ImageURL: string;
  public readonly ImageID: string;

  public readonly Action: TAction;

  private ImageData: IImageDataDocument | null;

  constructor(
    CommandAuthor: GuildMember,
    ImageName: string,
    Action: TAction,
    AuthorizedRoles: Snowflake[],
    ImageURL?: string,
    ImageID?: string
  ) {
    this.CommandAuthor = CommandAuthor;
    this.ImageName = ImageName;

    this.Action = Action;
    this.ImageURL = ImageURL || undefined;
    this.ImageID = ImageID || undefined;

    this.AuthorizedRoles = AuthorizedRoles;

    (async () => {
      this.ImageData = await ImageModel.findOne({
        GuildID: this.CommandAuthor.guild.id,
      });
    })();

    if (!this.ImageData) {
      this.ImageData = new ImageModel({
        GuildID: this.CommandAuthor.guild.id,
      });

      (async () => {
        this.ImageData.save();
      })();
    }
  }

  private GenerateID(): string {
    const LastImageAdded: IIMage =
      this.ImageData.Images[this.ImageData.Images.length - 1];

    return `Image_${LastImageAdded.ID}`;
  }

  public async CheckRoles() {
    if (
      this.AuthorizedRoles.length &&
      !this.AuthorizedRoles.some((RoleID: Snowflake) =>
        this.CommandAuthor.roles.cache.some((Role: Role) => Role.id === RoleID)
      )
    )
      throw new Error(
        `You are missing the required roles to run this command.`
      );
  }

  public GetImage(): IIMage {
    if (!this.ImageData.Images.length)
      throw new Error(`There are no images saved.`);

    const Image = this.ImageData.Images.find(
      (Image) =>
        Image.name.toLocaleLowerCase() === this.ImageName.toLocaleLowerCase()
    );

    if (!Image)
      throw new Error("The image that you're looking for does not exist.");

    return Image;
  }

  public async AddImage(): Promise<string> {
    await this.CheckRoles();

    if (!this.ImageData) throw new Error("I couldn't access the data :(");
    if (!this.ImageURL)
      throw new Error("Provide the Image URL to add a new image.");

    try {
      const NewImage: IIMage = {
        name: this.ImageName,
        URL: this.ImageURL,
        ID: this.GenerateID(),
        Author: this.CommandAuthor.id,
      };

      this.ImageData.Images.push(NewImage);

      await this.ImageData.save();

      return `Image Added Successfully!\nID: ${NewImage.ID}`;
    } catch (error) {
      throw new Error(`Failed to add the image. Error: ${error.message}`);
    }
  }

  public async RemoveImage(): Promise<string> {
    await this.CheckRoles();

    if (!this.ImageData) throw new Error("I couldn't access the data :(");
    if (!this.ImageID && !this.ImageName)
      throw new Error("Provide either the Image ID or Name to delete.");

    try {
      const TargetIndex = this.ImageData.Images.findIndex((Image: IIMage) => {
        if (this.ImageID) return Image.ID === this.ImageID;
        if (this.ImageName)
          return (
            Image.name.toLocaleLowerCase() ===
            this.ImageName.toLocaleLowerCase()
          );
        return false;
      });

      if (TargetIndex === -1)
        throw new Error("The provided image details do not exist.");

      this.ImageData.Images.splice(TargetIndex, 1);

      await this.ImageData.save();

      return `Image removed successfully!`;
    } catch (error) {
      throw new Error(`Failed to remove the image. Error: ${error.message}`);
    }
  }

  public async ListImages(): Promise<string[][]> {
    await this.CheckRoles();

    if (!this.ImageData) throw new Error("I couldn't access the data :(");

    try {
      const FormattedImages = this.ImageData.Images.map(
        (Image: IIMage) => `- ${Image.name}, <${Image.URL}>, ${Image.ID}`
      );

      const ChunkedImages: string[][] = [];
      for (let i = 0; i < FormattedImages.length; i += 5) {
        ChunkedImages.push(FormattedImages.slice(i, i + 5));
      }

      return ChunkedImages;
    } catch (error) {
      throw new Error(`Failed to list the images. Error: ${error.message}`);
    }
  }
}
