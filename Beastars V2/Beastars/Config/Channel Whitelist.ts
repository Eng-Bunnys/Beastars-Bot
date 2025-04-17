import {
  type GuildMember,
  type Snowflake,
  PermissionFlagsBits,
} from "discord.js";
import { type ISettings, SettingsService } from "../../Models/SettingsModel";

export class ChannelWhitelist {
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

  public async addChannel(channelID: Snowflake): Promise<void> {
    await this.checkAuthorPermissions();

    if (this.isChannelWhitelisted(channelID))
      throw new Error("This channel is already whitelisted");

    const updatedChannels = [...this.settings.channelIDs, channelID];
    this.settings = await SettingsService.updateChannelIDs(
      this.guildID,
      updatedChannels
    );
  }

  public async removeChannel(channelID: Snowflake): Promise<void> {
    await this.checkAuthorPermissions();

    if (!this.isChannelWhitelisted(channelID))
      throw new Error("This channel is not whitelisted");

    const updatedChannels = this.settings.channelIDs.filter(
      (id) => id !== channelID
    );
    this.settings = await SettingsService.updateChannelIDs(
      this.guildID,
      updatedChannels
    );
  }

  public async listChannels(): Promise<Snowflake[]> {
    await this.init();
    return this.settings.channelIDs;
  }

  public async clearChannels(): Promise<void> {
    await this.checkAuthorPermissions();
    this.settings = await SettingsService.updateChannelIDs(this.guildID, []);
  }

  public async isChannelWhitelisted(channelID: Snowflake): Promise<boolean> {
    await this.init();
    return this.settings.channelIDs.includes(channelID);
  }
}
