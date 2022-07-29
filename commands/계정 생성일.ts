import { Client, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";

module.exports = {
    name: "계정 생성일",
    type: ApplicationCommandType.User,
    dmPermission: false,

    run: async (client: Client, interaction: UserContextMenuCommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return;

        const user = await client.users.fetch(interaction.targetId);
        const member = await interaction.guild.members.fetch(interaction.targetId);

        if (!user.createdAt || !user.createdTimestamp) return;
        const diff = Math.abs((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const embed = {
            color: 0xf5bed1,
            author: {
                name: member.nickname || user.username,
                icon_url: user.displayAvatarURL(),
            },
            description: `🗓️ <@${user.id}>`,
            fields: [
                {
                    name: "계정 생성일",
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
                    inline: false,
                },
                {
                    name: "\u200B",
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R> ${Math.floor(diff)}일 전 `,
                    inline: false,
                },
            ],
        };
        await interaction.editReply({
            embeds: [embed],
        });
    },
};
