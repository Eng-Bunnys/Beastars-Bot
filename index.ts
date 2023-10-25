import { GatewayIntentBits } from "discord.js";
import GBFClient from "./utils/client";
import path from "path";
import { DefaultCommands } from "./handler/clienthandler";
const { TOKEN } = require(path.join(__dirname, "./config/GBFconfig.json"));

export const client = new GBFClient({
  Version: "2.6.0",
  CommandsFolder: "../commands",
  EventsFolder: "../events",
  Prefix: "b!",
  LogActions: true,
  SupportServer: "https://discord.gg/yrM7fhgNBW",
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks
  ],
  IgnoredHelpCategories: [],
  config: path.join(__dirname, "./config/GBFconfig.json"),
  Developers: ["333644367539470337", "841854342255345664"],
  TestServers: ["1131194563256664176"],
  Partners: ["333644367539470337", "841854342255345664"],
  DisabledCommands: [DefaultCommands.BotBan, DefaultCommands.EventSim],
  DisableDefaultCommands: true,
  DMCommands: false
});

(async () => {
  client.login(TOKEN).then(() => {
  });
})();
