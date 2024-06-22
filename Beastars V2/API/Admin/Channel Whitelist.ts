import {
  ChannelType,
  type GuildTextBasedChannel,
  type Snowflake,
  type TextChannel,
  type Guild,
  type GuildMember,
} from "discord.js";
import { AdminModel, type IAdminDocument } from "../../Modals/Admin Settings";
import { StatusCode } from "../../Handler";

type Response = {
  StatusCode: StatusCode;
  message: string;
};

type ActionTypeT = "Whitelist" | "Blacklist";

export class ChannelWhitelist {
  private AdminData: IAdminDocument | null = null;
  public readonly CommandAuthor: GuildMember;
  public readonly Server: Guild;

  constructor(CommandAuthor: GuildMember, Server: Guild) {
    this.CommandAuthor = CommandAuthor;
    this.Server = Server;
  }

  private ThrowError(status: StatusCode, message: string): Response {
    return { StatusCode: status, message };
  }

  private async ValidateData(): Promise<void> {
    const GuildID = this.Server?.id;
    if (!GuildID) {
      throw this.ThrowError(
        StatusCode.BadRequest,
        "Guild ID is not available."
      );
    }

    this.AdminData = await AdminModel.findOne({ GuildID: GuildID }).exec();

    if (!this.AdminData) this.AdminData = new AdminModel({ GuildID: GuildID });

    if (this.AdminData.isNew) await this.AdminData.save();
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

  public async GetWhitelistedChannels(): Promise<string> {
    await this.ValidateData();

    if (!this.Server) return "There are no Whitelisted Channels";

    const WhitelistedChannels = this.AdminData.WhiteListedChannels.map(
      (Channel: Snowflake) => `- <#${Channel}>`
    ).join("\n");

    return WhitelistedChannels.length
      ? WhitelistedChannels
      : "There are no Whitelisted Channels";
  }

  public async UpdateChannel(
    ActionType: ActionTypeT,
    Channel: GuildTextBasedChannel
  ): Promise<string> {
    await this.ValidateData();
    await this.CheckRoles();

    const IsChannelWhitelisted = (): boolean => {
      return this.AdminData.WhiteListedChannels.includes(Channel.id);
    };

    if (ActionType === "Whitelist") {
      if (!IsChannelWhitelisted()) {
        this.AdminData.WhiteListedChannels.push(Channel.id);
        await this.AdminData.save();
        return `Channel <#${Channel.id}> added to the whitelist.`;
      } else return `Channel <#${Channel.id}> is already in the whitelist.`;
    } else if (ActionType === "Blacklist") {
      if (IsChannelWhitelisted()) {
        this.AdminData.WhiteListedChannels =
          this.AdminData.WhiteListedChannels.filter((id) => id !== Channel.id);

        await this.AdminData.save();
        return `Channel <#${Channel.id}> removed from the whitelist.`;
      } else return `Channel <#${Channel.id}> is not in the whitelist.`;
    }
  }
}
