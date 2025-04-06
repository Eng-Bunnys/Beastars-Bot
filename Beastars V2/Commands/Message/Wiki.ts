import { hyperlink } from "discord.js";
import { BeastarsWiki } from "../../Beastars/Misc/Wiki";
import { MessageCommand, type GBF } from "../../Handler";

export class WikiCommandMessage extends MessageCommand {
  constructor(client: GBF) {
    super(client, {
      name: "wiki",
      description: "Search the Beastars wiki",
      category: "General",
      cooldown: 5,
      usage: `${client.Prefix}wiki <query>`,
      async execute({ client, message, args }) {
        try {
          const query = args.join(" ");

          if (!query.length)
            return message.reply({
              content: "Please provide a query to search the wiki with",
            });

          const wiki = new BeastarsWiki(query);
          const url = await wiki.search();

          if (!url) {
            return message.reply({
              content: `No results found for "${query}"`,
            });
          }

          return message.reply({
            content: `${hyperlink(query, url)}`,
          });
        } catch (error) {
          return message.reply({
            content: `An error occurred while searching the wiki. Please try again later.\n\n\n\`\`\`md\n${error}\`\`\``,
          });
        }
      },
    });
  }
}
