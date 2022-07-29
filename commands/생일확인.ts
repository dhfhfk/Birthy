import { Client, CommandInteraction, ApplicationCommandOptionType } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { getAge, getBirthstone, getNextBirthday, getZodiac } from "../utils/function";

module.exports = {
    name: "생일확인",
    description: "이 서버 멤버들의 생일을 확인해요.",
    dmPermission: false,
    options: [
        {
            name: "멤버",
            description: "선택한 멤버의 생일을 확인해요.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "멤버",
                    description: "조회할 멤버 검색",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        // {
        //     name: "월별",
        //     description: "월별 생일을 확인해요.",
        //     type: ApplicationCommandOptionType.Subcommand,
        // },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        if (!interaction.guild || !interaction.member) return;
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;

        // 설정 정보 가져오기
        const guildSetting = await Settings.findById(interaction.guild.id);

        if (!guildSetting || !guildSetting.isSetup) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    {
                        color: 0xf56969,
                        title: "<:xbold:985419129316065320> 생일 알림 기본 셋업이 되어있지 않아요!",
                        description: "서버 관리자가 직접 `/생일알림 셋업`명령어를 이용해 셋업을 진행해야 사용할 수 있어요.",
                        fields: [
                            {
                                name: "해결법",
                                value: interaction.member.permissions.has(["Administrator"]) ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요." : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요.",
                                inline: false,
                            },
                        ],
                        footer: { text: interaction.guild.id },
                    },
                ],
            });
        }

        switch (interaction.options.getSubcommand()) {
            case "멤버": {
                await interaction.deferReply({ ephemeral: true });
                const member = await interaction.guild.members.fetch(interaction.options.getUser("멤버", true));
                const targetData = await Birthdays.findById(member.id);
                if (!guildSetting)
                    return await interaction.editReply({
                        embeds: [
                            {
                                color: 0xf56969,
                                title: "<:xbold:985419129316065320> 생일 알림 기본 셋업이 되어있지 않아요!",
                                description: "서버 관리자가 직접 `/생일알림 셋업`명령어를 이용해 셋업을 진행해야 사용할 수 있어요.",
                                fields: [
                                    {
                                        name: "해결법",
                                        value: interaction.member.permissions.has(["Administrator"])
                                            ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요!"
                                            : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요!",
                                        inline: false,
                                    },
                                ],
                                footer: { text: interaction.guild?.id },
                            },
                        ],
                    });
                if (!targetData || !targetData.date) return await interaction.editReply({ content: `${member.nickname || member.user.username}님은 아직 생일정보를 등록하지 않았어요.` });
                const userGuildData: { _id: string; allowShowAge: boolean } | undefined = targetData.guilds.find((guild) => {
                    return guild._id == interaction.guildId;
                });
                if (!userGuildData) return await interaction.editReply({ content: `${member.nickname || member.user.username}님은 아직 생일정보를 등록하지 않았어요.` });

                const rawBirthday = targetData?.date;

                const age = getAge(rawBirthday);
                const month = ("0" + (rawBirthday.getMonth() + 1)).slice(-2);
                const day = ("0" + rawBirthday.getDate()).slice(-2);

                const nextBirthday = getNextBirthday(rawBirthday);

                const embed = {
                    color: 0xf5bed1,
                    author: {
                        name: member.nickname || member.user.username,
                        icon_url: member.displayAvatarURL(),
                    },
                    description: `<:cakeprogress:985470905314603018> <@${member.user.id}>`,
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

                if (guildSetting.subRole) {
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

                return;
            }
        }
    },
};
