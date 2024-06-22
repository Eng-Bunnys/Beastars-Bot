import { type Snowflake, type GuildMember, Role, hyperlink } from "discord.js";

import {
  type IIMage,
  type IImageDataDocument,
  ImageModel,
} from "../Modals/Image Schema";

import { StatusCode } from "../Handler";

import { AdminModel, IAdminDocument } from "../Modals/Admin Settings";

type TAction = "Add" | "Remove" | "Get" | "List";

type Response = {
  StatusCode: StatusCode;
  message: string;
  Image?: IIMage;
};

export class ImageActions {
  public readonly CommandAuthor: GuildMember;
  public readonly ImageName?: string;
  public readonly ImageURL?: string;
  public readonly ImageID?: string;
  public readonly Action: TAction;

  private ImageData: IImageDataDocument | null = null;
  private AdminData: IAdminDocument | null = null;

  constructor(
    CommandAuthor: GuildMember,
    ImageName: string,
    Action: TAction,
    ImageURL?: string,
    ImageID?: string
  ) {
    if (!CommandAuthor) {
      throw this.ThrowError(
        StatusCode.BadRequest,
        "Invalid Command Author Object Provided."
      );
    }

    this.CommandAuthor = CommandAuthor;
    this.ImageName = ImageName;
    this.Action = Action;
    this.ImageURL = ImageURL;
    this.ImageID = ImageID;

    this.InitializeData().catch((error) => {
      console.error("Error during data initialization\nError: ", error);
    });
  }

  private async InitializeData(): Promise<void> {
    await this.ValidateData();
  }

  private async ValidateData(): Promise<void> {
    const GuildID = this.CommandAuthor.guild?.id;
    if (!GuildID) {
      throw this.ThrowError(
        StatusCode.BadRequest,
        "Guild ID is not available."
      );
    }

    this.ImageData = await ImageModel.findOne({ GuildID: GuildID }).exec();
    this.AdminData = await AdminModel.findOne({ GuildID: GuildID }).exec();

    if (!this.ImageData) this.ImageData = new ImageModel({ GuildID: GuildID });

    if (!this.AdminData) this.AdminData = new AdminModel({ GuildID: GuildID });

    if (this.ImageData.isNew || this.AdminData.isNew) {
      await this.ImageData.save();
      await this.AdminData.save();
    }
  }

  private GenerateID(): string {
    return this.ImageData
      ? `Image_${this.ImageName.toUpperCase()}_${
          this.ImageData.Images.length + 1
        }`
      : "Image_1";
  }

  private async CheckRoles(): Promise<void> {
    if (!this.AdminData) {
      throw this.ThrowError(
        StatusCode.InternalServerError,
        "AdminData is not available."
      );
    }

    const AuthorizedRoles = this.AdminData.AuthorizedRoles;
    const HasRequiredRoles =
      AuthorizedRoles.length === 0 ||
      this.CommandAuthor.roles.cache.some((Role) =>
        AuthorizedRoles.includes(Role.id)
      );

    if (!HasRequiredRoles) {
      throw this.ThrowError(
        StatusCode.Unauthorized,
        "You are missing the required roles to use this feature."
      );
    }
  }

  private ThrowError(status: StatusCode, message: string): Response {
    return { StatusCode: status, message };
  }

  public async GetImage(): Promise<Response> {
    await this.ValidateData();

    if (!this.ImageData || !this.ImageData.Images.length) {
      throw this.ThrowError(
        StatusCode.NotFound,
        "No images are saved, add some!"
      );
    }

    if (this.Action !== "Get") {
      throw this.ThrowError(
        StatusCode.BadRequest,
        'Invalid Action Type for "Get"'
      );
    }

    const FoundImage = this.ImageData.Images.find(
      (Image) =>
        (this.ImageID &&
          Image.ID.toLocaleLowerCase() === this.ImageID.toLocaleLowerCase()) ||
        (this.ImageName &&
          Image.name.toLocaleLowerCase() === this.ImageName.toLocaleLowerCase())
    );

    if (!FoundImage) {
      throw this.ThrowError(
        StatusCode.NotFound,
        "The image that you're looking for does not exist."
      );
    }

    return {
      StatusCode: StatusCode.OK,
      message: "Success",
      Image: FoundImage,
    };
  }

  public async AddImage(): Promise<Response> {
    await this.ValidateData();
    await this.CheckRoles();

    if (!this.ImageData) {
      throw this.ThrowError(
        StatusCode.InternalServerError,
        "I couldn't access the data :("
      );
    }

    if (!this.ImageURL) {
      throw this.ThrowError(
        StatusCode.BadRequest,
        "Invalid Request Parameters, missing Image URL"
      );
    }

    if (this.Action !== "Add") {
      throw this.ThrowError(
        StatusCode.BadRequest,
        'Invalid Action Type for "Add"'
      );
    }

    const NewImage: IIMage = {
      name: this.ImageName,
      URL: this.ImageURL,
      ID: this.GenerateID(),
      Author: this.CommandAuthor.id,
    };

    this.ImageData.Images.push(NewImage);
    await this.ImageData.save();

    return {
      StatusCode: StatusCode.OK,
      message: `New Image Added!\nID: ${NewImage.ID}`,
      Image: NewImage,
    };
  }

  public async RemoveImage(): Promise<Response> {
    await this.ValidateData();
    await this.CheckRoles();

    if (!this.ImageData || !this.ImageData.Images.length) {
      throw this.ThrowError(
        StatusCode.NotFound,
        "No images available to remove."
      );
    }

    if (this.Action !== "Remove") {
      throw this.ThrowError(
        StatusCode.BadRequest,
        'Invalid Action Type for "Remove"'
      );
    }

    const ImageIndex = this.ImageData.Images.findIndex(
      (Image) =>
        (this.ImageID &&
          Image.ID.toLocaleLowerCase() === this.ImageID.toLocaleLowerCase()) ||
        (this.ImageName &&
          Image.name.toLocaleLowerCase() === this.ImageName.toLocaleLowerCase())
    );

    if (ImageIndex === -1) {
      throw this.ThrowError(
        StatusCode.NotFound,
        "The image that you're trying to remove does not exist."
      );
    }

    const RemovedImage = this.ImageData.Images.splice(ImageIndex, 1)[0];
    await this.ImageData.save();

    return {
      StatusCode: StatusCode.OK,
      message: `Image Removed Successfully!\nID: ${RemovedImage.ID}`,
      Image: RemovedImage,
    };
  }

  public async ListImages(): Promise<{
    StatusCode: StatusCode;
    message: string;
    Images?: string[][];
  }> {
    await this.ValidateData();

    if (!this.ImageData)
      throw {
        statusCode: StatusCode.InternalServerError,
        message: "I couldn't access the data :(",
      };

    if (this.Action !== "List")
      throw {
        statusCode: StatusCode.BadRequest,
        message:
          "Invalid Action Type, Specify the list type to list all of the images.",
      };

    try {
      const FormattedImages = this.ImageData.Images.map(
        (Image: IIMage) => `- ${hyperlink(Image.name, Image.URL)} | ${Image.ID}`
      );

      const ChunkedImages: string[][] = [];
      for (let i = 0; i < FormattedImages.length; i += 5) {
        ChunkedImages.push(FormattedImages.slice(i, i + 5));
      }

      return {
        StatusCode: StatusCode.OK,
        message: "Here are all of the images available!",
        Images: ChunkedImages,
      };
    } catch (error) {
      throw {
        StatusCode: StatusCode.InternalServerError,
        message: `Failed to list the images. Error: ${error.message}`,
      };
    }
  }
}
