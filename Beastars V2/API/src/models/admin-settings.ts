import { type Snowflake } from "discord.js";
import { Document, model, Schema } from "mongoose";

/**
 * @property {Snowflake} GuildID The Guild ID Snowflake
 * @property {Snowflake[]} AuthorizedRoles An array of role IDs that can run admin commands
 */
interface IAdmin {
  GuildID: Snowflake;
  AuthorizedRoles?: Snowflake[];
  WhiteListedChannels?: Snowflake[];
}

interface IAdminDocument extends IAdmin, Document {}

const AdminSchema = new Schema<IAdmin>(
  {
    GuildID: String,
    AuthorizedRoles: [String],
    WhiteListedChannels: [String],
  },
  {
    collection: "Beastars Admin Settings",
  }
);

const AdminModel = model<IAdminDocument>(
  "Beastars Admin Settings",
  AdminSchema
);

export { AdminModel, IAdmin, IAdminDocument };
