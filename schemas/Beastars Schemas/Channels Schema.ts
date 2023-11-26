import { Schema, model } from "mongoose";

interface IChannels {
  GuildID: string;
  Channel: [
    {
      ID: string;
      Type: string;
    }
  ];
}

const BeastersChannelsSchema = new Schema<IChannels>(
  {
    GuildID: String,
    Channel: [
      {
        ID: String,
        Type: String
      }
    ]
  },
  {
    collection: "Beastars Channels"
  }
);

const ChannelsModel = model<IChannels>(
  "Beastars Channels",
  BeastersChannelsSchema
);

export { IChannels, ChannelsModel };
