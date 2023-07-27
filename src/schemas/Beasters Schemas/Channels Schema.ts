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
    collection: "Beasters Channels"
  }
);

const ChannelsModel = model<IChannels>(
  "Beasters Channels",
  BeastersChannelsSchema
);

export { IChannels, ChannelsModel };
