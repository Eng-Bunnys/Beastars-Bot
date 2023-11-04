import GBFClient from "../handler/clienthandler";
import SlashCommand from "../utils/slashCommands";

import {
  ActionRowBuilder,
  CommandInteraction,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

interface IExecute {
  client: GBFClient;
  interaction: CommandInteraction;
}

export default class Feedback extends SlashCommand {
  constructor(client: GBFClient) {
    super(client, {
      name: "feedback",
      category: "General",
      description: "Give us feedback on what we can do better or fix!",
      dmEnabled: false
    });
  }

  async execute({ client, interaction }: IExecute) {
    const FeedbackModel = new ModalBuilder()
      .setCustomId(`feedbackModel`)
      .setTitle(`Enter your feedback here!`);

    const FeedbackInput = new TextInputBuilder()
      .setCustomId(`feedbackInput`)
      .setLabel("feedback - /ˈfiːdbak/")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder(`We care about what you think!`);

    const FeedbackRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        FeedbackInput
      );

    FeedbackModel.addComponents(FeedbackRow);

    await interaction.showModal(FeedbackModel);

  }
}
