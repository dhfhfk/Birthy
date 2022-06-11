import { Client, CommandInteraction } from "discord.js";
import { getLocaleString as t } from "../utils/localization";

module.exports = {
    name: "테스트",
    description: "테스트 명령어 설명",
    nameLocalizations: {
        "en-US": "test",
    },
    descriptionLocalizations: {
        "en-US": "test command description",
    },
    options: [
        {
            name: "echo",
            description: "`메시지` 인수를 전송합니다.",
            descriptionLocalizations: {
                "en-US": "send `Message` arg",
            },
            type: "SUB_COMMAND",
            options: [
                {
                    name: "message",
                    description: "전송할 메시지",
                    descriptionLocalizations: {
                        "en-US": "Message to send",
                    },
                    type: "STRING",
                    required: true,
                },
            ],
        },
        {
            name: "ping",
            description: "Discord API 지연 속도를 전송합니다.",
            type: "SUB_COMMAND",
            descriptionLocalizations: {
                "en-US": "send Discord API latency",
            },
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });
        switch (interaction.options.getSubcommand()) {
            case "echo": {
                return await interaction.editReply({ content: interaction.options.getString("message") });
            }
            case "ping": {
                return await interaction.editReply({ content: `${await t(locale, "discord_api_latency", [String(client.ws.ping)])}` });
            }
        }
    },
};
