import { Interaction, InteractionType } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";
import config from "../config";
import { getLocaleString as t } from "../utils/localization";

client.on("interactionCreate", async (interaction: Interaction) => {
    // 빗금 명령어
    if (!interaction.guild || !interaction.member) return;

    if (interaction.isChatInputCommand()) {
        if (!interaction.inCachedGuild()) return;
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command.permissions && !interaction.member.permissions.has(command.permissions)) {
                return await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            title: await t(interaction.locale, "permission_denied"),
                            description: await t(interaction.locale, "you_need_following_permission"),
                            color: 0xf56969,
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
            if (command.dev) {
                if (!config.dev_users) return;
                if (!config.dev_users.includes(interaction.user.id)) {
                    return await interaction.reply({ content: "개발자가 아닙니다. 이 명령어를 사용할 수 없습니다." });
                }
            }
            command.run(client, interaction, interaction.locale);
        });
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        switch (interaction.commandName) {
            case "생일알림":
            case "생일": {
                switch (interaction.options.getSubcommand()) {
                    case "지정":
                    case "등록":
                    case "나이공개": {
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

    if (interaction.isContextMenuCommand()) {
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command) command.run(client, interaction, interaction.locale);
        });
    }
});
