import { GatewayIntentBits } from "discord.js";
import { GBF } from "./Handler";
import path from "path";

export const client = new GBF({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  Version: "2.0.0",
  CommandsFolder: path.join(__dirname, "./Commands"),
  EventsFolder: path.join(__dirname, "./Events"),
  Prefix: "b!",
  LogActions: true,
  AutoLogin: true,
  Developers: ["333644367539470337"],
  TestServers: ["1131194563256664176"],
  SupportServer: "https://discord.gg/yrM7fhgNBW",
  DMEnabled: false,
  DefaultColor: "#ed0b3a",
});
