import { ChannelType, Events, ModalSubmitInteraction } from "discord.js";
import GBFClient from "../../handler/clienthandler";
import { ChannelsModel } from "../../schemas/Beastars Schemas/Channels Schema";

export default function getChannel(client: GBFClient) {
  client.on(
    Events.InteractionCreate,
    async (interaction: ModalSubmitInteraction) => {
      if (!interaction.isModalSubmit()) return;

      let GuildData = await ChannelsModel.findOne({
        GuildID: interaction.guild.id
      });

      if (!GuildData) {
        GuildData = new ChannelsModel({
          GuildID: interaction.guild.id,
          Channel: []
        });
        await GuildData.save();
      }

      const GeneralInput = interaction.customId.split("_");
      const ActionType = GeneralInput[0];

      const userInput = interaction.fields.getTextInputValue("channelInput");

      const targetChannel = interaction.guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildText &&
          (channel.name.toLowerCase() === userInput.toLowerCase() ||
            channel.id === userInput)
      );

      if (!targetChannel) {
        interaction.reply({
          content: `I could not find ${userInput}`,
          ephemeral: true
        });
        return;
      }

      if (
        GuildData.Channel.length &&
        GuildData.Channel.find((item) => item.ID == targetChannel.id)?.Type ===
          ActionType
      ) {
        interaction.reply({
          content: `The specified channel is already on the ${ActionType}'d channel list`,
          ephemeral: true
        });
        return;
      }

      if (
        GuildData.Channel.length &&
        GuildData.Channel.find((item) => item.ID == targetChannel.id)
      ) {
        const SpecifiedItem = GuildData.Channel.find(
          (item) => item.ID == targetChannel.id
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
        ID: targetChannel.id,
        Type: ActionType
      };

      GuildData.Channel.push(SetData);
      await GuildData.save();

      await interaction.reply({
        content: `Success, I've set the channel <#${targetChannel.id}> to the ${ActionType} channel list`
      });
    }
  );
}
