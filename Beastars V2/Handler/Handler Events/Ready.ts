import { Events } from "discord.js";
import { GBF } from "../GBF";
import { redBright } from "chalk";

import { textSync } from "figlet";

export function GBFReady(client: GBF) {
  client.on(Events.ClientReady, async () => {
    console.log(
      redBright(
        textSync(`${client.user.username}`, {
          horizontalLayout: "full",
        })
      )
    );

    console.log("Beastars Bot is now online\n\nWritten by .Bunnys");

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
