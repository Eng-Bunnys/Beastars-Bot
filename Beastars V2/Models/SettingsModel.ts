import { type Snowflake } from "discord.js";
import { Schema, model, Document } from "mongoose";

interface ISettings extends Document {
  guildID: Snowflake;
  adminRoles: Snowflake[];
  channelIDs: Snowflake[];
}

const settingsSchema = new Schema<ISettings>(
  {
    guildID: { type: String, required: true, unique: true },
    adminRoles: { type: [String], required: true },
    channelIDs: { type: [String], required: true },
  },
  {
    collection: "Beastars Settings",
    strict: true,
    _id: false,
  }
);

const SettingsModel = model<ISettings>("Beastars Settings", settingsSchema);

export { SettingsModel, ISettings };
