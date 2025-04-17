import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  CommandInteractionOptionResolver,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  type Snowflake,
  type GuildMember,
  type ButtonInteraction,
} from "discord.js";
import {
  SlashCommand,
  GBF,
  messageSplit,
  ColorCodes,
  Emojis,
} from "../../../Handler";
import { AdminRoles } from "../../../Beastars/Config/Admin Roles";
import { PaginatedEmbed } from "../../../Utils/PaginationHelper";

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
        remove: {
          description: "Remove an admin role from the server",
          SubCommandOptions: [
            {
              name: "role",
              description: "The role to remove from admin",
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

              await adminRoles.removeRole(role.id);

              return interaction.reply({
                content: `Role ${role} has been removed from admin roles`,
                allowedMentions: {
                  roles: [],
                },
              });
            } catch (error) {
              return interaction.reply({
                content: `I ran into an error while trying to remove the role from admin roles.\n\n\`\`\`md\n${error}\`\`\``,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
        list: {
          description: "List all admin roles in the server",
          async execute({ client, interaction }) {
            try {
              const rolesHelper = new AdminRoles(
                interaction.member as GuildMember
              );

              const adminRoles = await rolesHelper.listRoles();

              if (!adminRoles.length) 
                return interaction.reply({
                  content: "No admin roles have been set.",
                  flags: MessageFlags.Ephemeral,
                });

                // Note: doesn't work!!!

              const roles = adminRoles.map(
                (role, index) => `**${index + 1}** - <@&${role}>`
              );

              const pageTracker = new Map<string, number>();

              await PaginatedEmbed.fromList({
                interaction,
                userID: interaction.user.id,
                sessionID: "adminList",
                items: roles,
                itemsPerPage: 50,
                title: "Admin Roles",
                color: ColorCodes.Default,
                timeout: 60000,
                pageTracker,
              });
            } catch (error) {
              return interaction.reply({
                content: `I ran into an error while trying to list the admin roles.\n\n\`\`\`md\n${error}\`\`\``,
                flags: MessageFlags.Ephemeral,
              });
            }
          },
        },
      },
    });
  }
}
