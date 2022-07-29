import { Client, UserContextMenuCommandInteraction, ApplicationCommandType } from "discord.js";
import Birthdays from "../models/birthdays";
import Settings from "../models/guild-settings";
import { getZodiac, getBirthstone, getAge, getNextBirthday } from "../utils/function";

module.exports = {
    name: "생일 확인",
    type: ApplicationCommandType.User,
    dmPermission: false,

    run: async (client: Client, interaction: UserContextMenuCommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild || !interaction.member) return;

        const user = await client.users.fetch(interaction.targetId);
        const guildData = await Settings.findById(interaction.guildId).lean();
        const userData = await Birthdays.findById(user.id).lean();

        if (!interaction.inCachedGuild()) return;

        if (!guildData)
            return await interaction.editReply({
                embeds: [
                    {
                        color: 0xf56969,
                        title: "<:xbold:985419129316065320> 생일 알림 기본 셋업이 되어있지 않아요!",
                        description: "서버 관리자가 직접 `/생일알림 셋업`명령어를 이용해 셋업을 진행해야 사용할 수 있어요.",
                        fields: [
                            {
                                name: "해결법",
                                value: interaction.member.permissions.has(["Administrator"]) ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요!" : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요!",
                                inline: false,
                            },
                        ],
                        footer: { text: interaction.guild.id },
                    },
                ],
            });
        if (!userData || !userData.date) return await interaction.editReply({ content: `${user.username}님은 아직 생일정보를 등록하지 않았어요.` });
        const userGuildData = userData.guilds.find((guild) => {
            return guild._id == interaction.guildId;
        });
        if (!userGuildData) return await interaction.editReply({ content: `${user.username}님은 아직 생일정보를 등록하지 않았어요.` });

        const rawBirthday = userData?.date;

        const age = getAge(rawBirthday);
        const month = ("0" + (rawBirthday.getMonth() + 1)).slice(-2);
        const day = ("0" + rawBirthday.getDate()).slice(-2);

        const nextBirthday = getNextBirthday(rawBirthday);

        const embed = {
            color: 0xf5bed1,
            author: {
                name: user.username,
                icon_url: user.displayAvatarURL(),
            },
            description: `<:cakeprogress:985470905314603018> <@${user.id}>`,
            fields: [
                {
                    name: "생일",
                    value: `${userGuildData.allowShowAge ? `${rawBirthday.getFullYear()}년` : ""} ${month}월 ${day}일\n<t:${nextBirthday.unix}:R>`,
                    inline: false,
                },
                {
                    name: "나이",
                    value: `${userGuildData.allowShowAge ? `${age.korean}살 (만 ${age.western}살)` : "🔒"}`,
                    inline: false,
                },
            ],
        };

        if (guildData.subRole) {
            const zodiac = getZodiac(rawBirthday);
            const birthstone = getBirthstone(rawBirthday);
            const zodiacField = {
                name: "별자리",
                value: `${zodiac.emoji} ${zodiac.name}`,
                inline: true,
            };

            const birthstoneField = {
                name: "탄생석",
                value: birthstone.name,
                inline: true,
            };
            embed.fields?.push(zodiacField, birthstoneField);
        }

        await interaction.editReply({
            embeds: [embed],
        });
    },
};
