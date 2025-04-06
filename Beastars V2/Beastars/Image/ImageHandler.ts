import {
  type Client,
  type Guild,
  type GuildMember,
  type Snowflake,
  type User,
} from "discord.js";
import { type IImage, ImageDataHandler } from "../../Models/ImageModel";
import { type GBF } from "../../Handler";

export type Action = "Add" | "Remove" | "List";

export class BeastarsImage {
  public readonly client: GBF | Client;
  public readonly adminRoles: Snowflake[];
  public readonly guild: Guild;
  public readonly user: User;
  private readonly _guildMember: GuildMember;
  public readonly imageData: ImageDataHandler;

  constructor(
    client: GBF | Client,
    user: User,
    guild: Guild,
    adminRoles: Snowflake[]
  ) {
    this.client = client;
    this.user = user;
    this.guild = guild;
    this.adminRoles = adminRoles;

    const member = this.getMember();

    if (!member)
      throw new Error("The specified user is not a member of the server");

    this._guildMember = member;
    this.imageData = new ImageDataHandler(this.guild.id);
  }

  private getMember(): GuildMember | null {
    return this.guild.members.cache.get(this.user.id) ?? null;
  }

  private async checkAdmin(): Promise<boolean> {
    try {
      await this.imageData.init();

      if (this.adminRoles.length === 0) return true;

      return this.adminRoles.some((roleID) =>
        this._guildMember.roles.cache.has(roleID)
      );
    } catch (error) {
      throw new Error(`Failed to check admin status: ${error.message}`);
    }
  }

  private isValidURL(url: string): boolean {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)/i;
    return imageExtensions.test(url);
  }

  public async addImage(name: string, URL: string): Promise<string> {
    try {
      if (!(await this.checkAdmin()))
        throw new Error("You do not have permission to add images.");

      if (!this.isValidURL(URL))
        throw new Error(
          "Please provide a valid image URL (must end with .jpg, .png, .gif, etc. or be from a trusted image hosting service)."
        );

      return await this.imageData.addImage(name, URL);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async removeImage(imageID: string): Promise<void> {
    try {
      if (!(await this.checkAdmin()))
        throw new Error("You do not have permission to remove images.");

      await this.imageData.removeImage(imageID);
    } catch (error) {
      throw new Error(`Failed to remove image: ${error.message}`);
    }
  }

  public async listImages(): Promise<string> {
    try {
      return await this.imageData.listImages();
    } catch (error) {
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  public async getImageIDs(): Promise<string[]> {
    try {
      const imageData = await this.imageData.init();
      return imageData.images.map((image) => image.imageID);
    } catch (error) {
      throw new Error(`Failed to get image IDs: ${error.message}`);
    }
  }

  public async getImageByID(imageID: string): Promise<IImage> {
    try {
      const imageData = await this.imageData.init();
      const image = imageData.images.find(
        (img) => img.imageID.toLowerCase() === imageID.toLowerCase()
      );

      if (!image) throw new Error("Image not found");

      return image;
    } catch (error) {
      throw new Error(`Failed to get image by ID: ${error.message}`);
    }
  }
}
