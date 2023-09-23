import {
  ChannelType,
  EmbedBuilder,
  Events,
  ModalSubmitInteraction,
  TextBasedChannel
} from "discord.js";
import GBFClient from "../../handler/clienthandler";
import { ChannelsModel } from "../../schemas/Beastars Schemas/Channels Schema";

export default function getChannel(client: GBFClient) {
  client.on(
    Events.InteractionCreate,
    async (interaction: ModalSubmitInteraction): Promise<any> => {
      if (!interaction.isModalSubmit()) return;

      if (interaction.customId === "feedbackModel") {
        const userInput = interaction.fields.getTextInputValue("feedbackInput");

        const feedbackChannel = client.channels.cache.get(
          "1154993729069908001"
        ) as TextBasedChannel;

        const UserFeedback = new EmbedBuilder()
          .setTitle(
            `${interaction.user.username} [${interaction.user.id}] - Feedback`
          )
          .setColor("Blurple")
          .setDescription(
            `${userInput}\n\n<t:${Math.floor(Date.now() / 1000)}:F>`
          );

        await feedbackChannel.send({
          embeds: [UserFeedback]
        });

        return interaction.reply({
          content: `Thank you for helping us grow ${client.user.username} ${interaction.user.username}!`,
          ephemeral: true
        });
      }

      if (interaction.customId.includes("_")) {
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
          GuildData.Channel.find((item) => item.ID == targetChannel.id)
            ?.Type === ActionType
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
    }
  );
}
