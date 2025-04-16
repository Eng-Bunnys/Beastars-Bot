import {
  ApplicationCommandOptionType,
  type CommandInteractionOptionResolver,
  hyperlink,
} from "discord.js";
import { SlashCommand, type GBF } from "../../../Handler";
import { BeastarsWiki } from "../../../Beastars/Misc/Wiki";

export class WikiSearchInteraction extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "wiki",
      description: "Search the Beastars wiki",
      category: "General",
      cooldown: 5,
      options: [
        {
          name: "query",
          description: "The query to search the wiki with",
          type: ApplicationCommandOptionType.String,
          required: true,
          minLength: 1,
          maxLength: 100,
        },
      ],
      async execute({ client, interaction }) {
        try {
          await interaction.deferReply();

          const query = (
            interaction.options as CommandInteractionOptionResolver
          ).getString("query", true);

          const wiki = new BeastarsWiki(query);
          const url = await wiki.search();

          if (!url) {
            return interaction.editReply({
              content: `No results found for "${query}"`,
            });
          }

          return interaction.editReply({
            content: `${hyperlink(query, url)}`,
          });
        } catch (error) {
          return interaction.editReply({
            content: `An error occurred while searching the wiki. Please try again later.\n\n\n\`\`\`md\n${error}\`\`\``,
          });
        }
      },
    });
  }
}
