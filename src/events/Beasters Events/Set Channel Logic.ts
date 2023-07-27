import { Events, StringSelectMenuInteraction } from "discord.js";
import GBFClient from "../../handler/clienthandler";
import { ChannelsModel } from "../../schemas/Beasters Schemas/Channels Schema";

export default function SetChannel(client: GBFClient) {
  client.on(
    Events.InteractionCreate,
    async (interaction: StringSelectMenuInteraction) => {
      if (!interaction.isStringSelectMenu()) return;

      const GeneralInput = interaction.values[0].split("_");

      const ActionType = GeneralInput[0];
      const ChannelID = GeneralInput[1];

      const InteractionAuthor = interaction.customId.split("_")[0];

      if (InteractionAuthor != interaction.user.id) {
        interaction.reply({
          content: `You cannot use this button, only <@${InteractionAuthor}> can`,
          ephemeral: true
        });
        return;
      }

      let GuildData = await ChannelsModel.findOne({
        GuildID: interaction.guild.id
      });

      if (!GuildData) {
        GuildData = new ChannelsModel({
          GuildID: interaction.guild.id
        });
        await GuildData.save();
      }

      if (
        GuildData.Channel.find((item) => item.ID == ChannelID).Type ===
        ActionType
      ) {
        interaction.reply({
          content: `The specified channel is already on the ${ActionType}'d channel list`,
          ephemeral: true
        });
        return;
      }

      if (GuildData.Channel.find((item) => item.ID == ChannelID)) {
        const SpecifiedItem = GuildData.Channel.find(
          (item) => item.ID == ChannelID
        );
        const ItemIndex = GuildData.Channel.indexOf(SpecifiedItem);
        if (ItemIndex !== -1) GuildData.Channel.splice(ItemIndex, 1);
        await GuildData.save();
      }

      interface IChannelData {
        ID: string;
        Type: string;
      }

      const SetData: IChannelData = {
        ID: ChannelID,
        Type: ActionType
      };

      GuildData.Channel.push(SetData);
      await GuildData.save();

      await interaction.reply({
        content: `Success, I've set the channel <#${ChannelID}> to the ${ActionType} channel list`
      });
    }
  );
}
