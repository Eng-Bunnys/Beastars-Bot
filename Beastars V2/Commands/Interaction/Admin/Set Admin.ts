import {
  ApplicationCommandOptionType,
  CommandInteractionOptionResolver,
  MessageFlags,
  type GuildMember,
} from "discord.js";
import { SlashCommand, GBF } from "../../../Handler";
import { AdminRoles } from "../../../Beastars/Config/Admin Roles";

export class SetAdminRolesSlash extends SlashCommand {
  constructor(client: GBF) {
    super(client, {
      name: "admin-role",
      description: "Set admin roles for the server",
      category: "Admin",
      cooldown: 5,
      subcommands: {
        add: {
          description: "Set an admin role for the server",
          SubCommandOptions: [
            {
              name: "role",
              description: "The role to set as admin",
              type: ApplicationCommandOptionType.Role,
              required: true,
            },
          ],
          async execute({ client, interaction }) {
            const role = (
              interaction.options as CommandInteractionOptionResolver
            ).getRole("role", true);

            try {
              const adminRoles = new AdminRoles(
                interaction.member as GuildMember
              );

              await adminRoles.addRole(role.id);

              return interaction.reply({
                content: `Role ${role} has been set as an admin role`,
                allowedMentions: {
                  roles: [],
                },
              });
            } catch (error) {
              return interaction.reply({
                content: `I ran into an error while trying to set the role as admin.\n\n\`\`\`md\n${error}\`\`\``,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
      },
    });
  }
}
