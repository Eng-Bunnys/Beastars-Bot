import {
  type GuildMember,
  type Snowflake,
  PermissionFlagsBits,
} from "discord.js";
import { type ISettings, SettingsService } from "../../Models/SettingsModel";

export class AdminRoles {
  private readonly guildID: Snowflake;
  private readonly commandAuthor: GuildMember;
  private settings: ISettings;
  private isInitialized = false;

  constructor(commandAuthor: GuildMember) {
    this.commandAuthor = commandAuthor;
    this.guildID = commandAuthor.guild.id;
  }

  private async init(): Promise<void> {
    if (this.isInitialized) return;

    this.settings = await SettingsService.getOrCreateSettings(this.guildID);
    this.isInitialized = true;
  }

  private async checkAuthorPermissions(): Promise<void> {
    await this.init();

    const hasAdminRole = this.settings.adminRoles.some((roleID) =>
      this.commandAuthor.roles.cache.has(roleID)
    );

    if (
      !this.commandAuthor.permissions.has(PermissionFlagsBits.Administrator) &&
      !hasAdminRole
    )
      throw new Error("You do not have permission to use this command");
  }

  public async addRole(roleID: Snowflake): Promise<void> {
    await this.checkAuthorPermissions();

    if (this.settings.adminRoles.includes(roleID))
      throw new Error("This role is already an admin role");

    if (this.guildID === roleID)
      throw new Error("You cannot set `@everyone` as an admin role");

    const updatedRoles = [...this.settings.adminRoles, roleID];
    this.settings = await SettingsService.updateAdminRoles(
      this.guildID,
      updatedRoles
    );
  }

  public async removeRole(roleID: Snowflake): Promise<void> {
    await this.checkAuthorPermissions();

    if (!this.settings.adminRoles.includes(roleID))
      throw new Error("This role is not an admin role");

    const updatedRoles = this.settings.adminRoles.filter((id) => id !== roleID);
    this.settings = await SettingsService.updateAdminRoles(
      this.guildID,
      updatedRoles
    );
  }

  public async listRoles(): Promise<Snowflake[]> {
    await this.init();
    return this.settings.adminRoles;
  }

  public async clearRoles(): Promise<void> {
    await this.checkAuthorPermissions();
    this.settings = await SettingsService.updateAdminRoles(this.guildID, []);
  }
}
