import { Client, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import { Colors } from "../models/Constants";

module.exports = {
    name: "서버 참가일",
    type: ApplicationCommandType.User,
    dmPermission: false,

    run: async (client: Client, interaction: UserContextMenuCommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return;
        let member;

        const user = await client.users.fetch(interaction.targetId);
        try {
            member = await interaction.guild.members.fetch(interaction.targetId);
        } catch (e) {
            return await interaction.editReply({
                embeds: [
                    {
                        color: Colors.error,
                        author: {
                            name: user.username,
                            icon_url: user.displayAvatarURL(),
                        },
                        title: "<:xbold:985419129316065320> 서버에 멤버가 존재하지 않아요",
                    },
                ],
            });
        }

        if (!member.joinedAt || !member.joinedTimestamp) return;
        const diff = Math.abs((new Date().getTime() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
        const embed = {
            color: Colors.primary,
            author: {
                name: member.nickname || user.username,
                icon_url: user.displayAvatarURL(),
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
        return await interaction.editReply({
            embeds: [embed],
        });
    },
};
