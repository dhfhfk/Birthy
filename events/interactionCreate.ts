import { Interaction } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";
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

    if (interaction.isAutocomplete()) {
        switch (interaction.commandName) {
            case "생일": {
                switch (interaction.options.getSubcommand()) {
                    case "등록":
                    case "공개설정": {
                        const guildSetting = await Settings.findById(interaction.guildId);
                        if (!guildSetting) {
                            await interaction.respond([{ name: "`/생일알림 셋업`을 진행해주세요.", value: "notYetSet" }]);
                            return;
                        }
                        const choices = [
                            {
                                name: "공개",
                                value: "true",
                            },
                        ];
                        if (guildSetting.allowHideAge) {
                            choices.push({ name: "비공개", value: "false" });
                        } else choices[0].name = "공개 (서버 설정에 의해 제한됨)";

                        await interaction.respond(choices);
                        break;
                    }
                }
            }
        }
    }

    if (interaction.isContextMenu()) {
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command) command.run(client, interaction, interaction.locale);
        });
    }
});
