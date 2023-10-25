import {
  ButtonInteraction,
  ColorResolvable,
  EmbedBuilder,
  Events
} from "discord.js";
import GBFClient from "../../handler/clienthandler";
import colors from "../../GBF/GBFColor.json";

export default function mangaHelp(client: GBFClient) {
  client.on(
    Events.InteractionCreate,
    async (interaction: ButtonInteraction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "mdHELP") {
        const mangaHelp = new EmbedBuilder()
          .setTitle(`${client.Prefix}manga`)
          .setColor(colors.DEFAULT as ColorResolvable)
          .setDescription(
            `${client.Prefix} manga [source] <group> [series] [chapter] [page]\n[] = required\n<> = optional`
          )
          .addFields(
            {
              name: "Source:",
              value: `- MD\n - MangaDex\n- G\n - Google Drive Back Up\n- R\n - Raws from Google Drive\n- V\n -  Viz Version from Google Drive`
            },
            {
              name: "Group:",
              value: `- HCS\n - Hot Chocolate Scans\n- HG\n - Hybridgumi`
            },
            {
              name: "Series:",
              value:
                "- BST\n - Beastars\n- BC\n - Beast Complex\n- OBC\n - Original Beast Complex\n- PG\n - Paru Graffiti"
            }
          );

        await interaction.reply({
          embeds: [mangaHelp],
          ephemeral: true
        });
        return;
      }
    }
  );
}
