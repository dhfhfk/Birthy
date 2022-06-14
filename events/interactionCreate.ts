import { Interaction } from "discord.js";
import client from "../bot";
import { getLocaleString as t } from "../utils/localization";

client.on("interactionCreate", async (interaction: Interaction) => {
    // 빗금 명령어
    if (interaction.isCommand()) {
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command.permissions && !interaction.member.permissions.has(command.permissions)) {
                return await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            title: await t(interaction.locale, "permission_denied"),
                            description: await t(interaction.locale, "you_need_following_permission"),
                            color: "#f56969",
                            fields: [
                                {
                                    name: await t(interaction.locale, "required_permission"),
                                    value: await t(interaction.locale, command.permissions[0].toLowerCase()),
                                },
                            ],
                        },
                    ],
                });
            }
            command.run(client, interaction, interaction.locale);
        });
    }

    if (interaction.isContextMenu()) {
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command) command.run(client, interaction, interaction.locale);
        });
    }
});
