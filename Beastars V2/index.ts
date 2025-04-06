import { GatewayIntentBits } from "discord.js";
import { BuiltInCommands, BuiltInEvents, GBF } from "./Handler/GBF";

import path from "path";

export const client = new GBF({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  Version: "2.0.0",
  CommandsFolder: path.join(__dirname, "./Commands"),
  // EventsFolder: path.join(__dirname, "./Events"),
  Prefix: "!?",
  AutoLogin: true,
  Developers: ["333644367539470337"],
  TestServers: ["1131194563256664176"],
  DMEnabled: false,
  DefaultColor: "Blurple",
  LogActions: true,
});
