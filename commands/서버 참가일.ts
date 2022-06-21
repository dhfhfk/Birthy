import { Client, ContextMenuInteraction, EmbedFieldData, MessageEmbedOptions } from "discord.js";
import Birthdays from "../models/birthdays";
import Settings from "../models/guild-settings";
import { getZodiac, getBirthstone, getAge, getNextBirthday } from "../utils/function";
import { getLocaleString as t } from "../utils/localization";

module.exports = {
    name: "서버 참가일",
    type: "USER",

    run: async (client: Client, interaction: ContextMenuInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        const user = await client.users.fetch(interaction.targetId);
        const member = await interaction.guild.members.fetch(interaction.targetId);

        if (!member.joinedAt || !member.joinedTimestamp) return;
        const diff = Math.abs((new Date().getTime() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
        const embed: MessageEmbedOptions = {
            color: "#f5bed1",
            author: {
                name: member.nickname || user.username,
                icon_url: user.displayAvatarURL({ dynamic: true }),
            },
            description: `🗓️ <@${user.id}>`,
            fields: [
                {
                    name: "서버 참가일",
                    value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                    inline: false,
                },
                {
                    name: "\u200B",
                    value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R> ${Math.floor(diff)}일 전 `,
                    inline: false,
                },
            ],
        };
        await interaction.editReply({
            embeds: [embed],
        });
    },
};
