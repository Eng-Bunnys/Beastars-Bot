import os from "os";

import { ActivityType, Events } from "discord.js";
import GBFClient from "../../handler/clienthandler";

export default function botReady(client: GBFClient) {
  client.on(Events.ClientReady, async () => {
    client.user.setPresence({
      activities: [{ name: "Beasters Bot", type: ActivityType.Watching }],
      status: "online"
    });

    console.log(`${client.user.username} is now online`);

    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      console.log(
        "[ERROR] Unhandled Rejection at: Promise ",
        promise,
        " reason: ",
        reason.message
      );
    });
  });

  process.on("uncaughtException", (err: Error, origin: string) => {
    console.log(`Caught uncaughtException: ${err}`);
  });
}
