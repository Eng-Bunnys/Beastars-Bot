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
    adminRoles: { type: [String] },
    channelIDs: { type: [String] },
  },
  {
    collection: "Beastars Settings",
    strict: true,
  }
);

const SettingsModel = model<ISettings>("Beastars Settings", settingsSchema);

class SettingsService {
  static async getOrCreateSettings(guildID: Snowflake): Promise<ISettings> {
    let settings = await SettingsModel.findOne({ guildID });

    if (!settings) {
      settings = new SettingsModel({
        guildID,
        adminRoles: [],
        channelIDs: [],
      });

      await settings.save();
    }

    return settings;
  }

  static async updateAdminRoles(
    guildID: Snowflake,
    roles: Snowflake[]
  ): Promise<ISettings> {
    return await SettingsModel.findOneAndUpdate(
      { guildID },
      { adminRoles: roles },
      { new: true, upsert: true }
    );
  }

  static async updateChannelIDs(
    guildID: Snowflake,
    channelIDs: Snowflake[]
  ): Promise<ISettings> {
    return await SettingsModel.findOneAndUpdate(
      { guildID },
      { channelIDs },
      { new: true, upsert: true }
    )
      .lean<ISettings>()
      .exec();
  }
}

export { SettingsModel, ISettings, SettingsService };
