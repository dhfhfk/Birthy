import { Client, ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { getBirthstone, getZodiac, sendLogMessage } from "../utils/function";
import { Colors } from "../models/Constants";

module.exports = {
    name: "생일",
    description: "내 생일을 등록하거나 관리해요",
    dmPermission: false,
    options: [
        {
            name: "등록",
            description: "내 생일을 등록하고 멤버들의 축하를 받아보세요!",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "나이공개",
                    description: "다른 멤버에게 나이를 공개할까요? (서버 설정에 따름)",
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true,
                },
            ],
        },
        {
            name: "변경",
            description: "내 생일을 변경해요. (한 달에 한 번 변경 가능해요)",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "삭제",
            description: "등록했던 내 생일을 삭제해요.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "서버설정",
            description: "이 서버에서 생일을 확인할 수 없도록 설정해요.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        // {
        //     name: "알림설정",
        //     description: "생일은 공개하되 메시지 알림은 받지 않도록 토글해요.",
        //     type: ApplicationCommandOptionType.Subcommand,
        // },
        {
            name: "나이공개",
            description: "이 서버에서 나이를 공개할지 설정해요.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "나이공개",
                    description: "다른 멤버에게 나이를 공개할까요? (서버 설정에 따름)",
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                    required: true,
                },
            ],
        },
    ],

    run: async (client: Client, interaction: ChatInputCommandInteraction, locale: string) => {
        // 설정 정보 가져오기

        if (!interaction.guild) return;

        const guildSetting = await Settings.findById(interaction.guild.id);
        const userData = await Birthdays.findById(interaction.user.id);

        if (!interaction.inCachedGuild())
            return await interaction.reply({
                ephemeral: true,
                content: "알 수 없는 오류 발생",
            });

        if (!guildSetting || !guildSetting.isSetup) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    {
                        color: Colors.error,
                        title: "<:xbold:985419129316065320> 기본 생일 셋업이 되어있지 않아요!",
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
            case "알림설정": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                await userData.updateOne({ allowCreateNotifi: !userData.allowCreateNotifi });
                await interaction.reply({
                    embeds: [
                        {
                            color: Colors.primary,
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL(),
                            },
                            title: `<:cakeprogress:985470905314603018> 나이가 ${JSON.parse(interaction.options.getString("나이공개", true)) ? "공개" : "비공개"}된 생일을 공유하도록 설정했어요`,
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                });
                return;
            }
            case "변경": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                if (userData?.modifiedCount >= 1) {
                    const remaining = userData.lastModifiedAt;
                    remaining.setMonth(userData.lastModifiedAt.getMonth() + 1);

                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 더이상 생일을 변경할 수 없어요.",
                                description: `<t:${Math.floor(remaining.getTime() / 1000).toFixed(0)}:R> 에 다시 변경할 수 있어요.`,
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                const today = new Date();
                await interaction.showModal({
                    title: "생일 변경",
                    customId: `birthday-change-${interaction.user.id}`,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    customId: "birthday",
                                    label: `${
                                        today.getFullYear() +
                                        (today.getMonth() + 1 > 9 ? (today.getMonth() + 1).toString() : "0" + (today.getMonth() + 1)) +
                                        (today.getDate() > 9 ? today.getDate().toString() : "0" + today.getDate().toString())
                                    } 형식으로 입력해주세요.`,
                                    style: 1,
                                    minLength: 8,
                                    maxLength: 8,
                                    placeholder:
                                        today.getFullYear() +
                                        (today.getMonth() + 1 > 9 ? (today.getMonth() + 1).toString() : "0" + (today.getMonth() + 1)) +
                                        (today.getDate() > 9 ? today.getDate().toString() : "0" + today.getDate().toString()),
                                    required: true,
                                },
                            ],
                        },
                    ],
                });

                break;
            }
            case "나이공개": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                if (interaction.options.getString("나이공개", true) != "true" && interaction.options.getString("나이공개", true) != "false") {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 나이공개 옵션이 잘못 입력되었어요",
                                description: "옵션을 입력하지 말고 눌러서 선택해주세요.",
                                image: {
                                    url: "https://i.ibb.co/rdpGVVZ/2-allow-Show-Age-typing.png",
                                },
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                if (!guildSetting.allowHideAge && interaction.options.getString("나이공개", true) === "false") {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 나이공개 옵션이 잘못 입력되었어요",
                                description: "이 서버에서는 나이를 비공개할 수 없어요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                const userGuildData = userData.guilds.find((guild) => interaction.guildId == guild._id);
                if (!userGuildData) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.primary,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: `<:cakeprogress:985470905314603018> 나이가 ${JSON.parse(interaction.options.getString("나이공개", true)) ? "공개" : "비공개"}된 생일을 공유하도록 설정했어요`,
                                description: "이미 등록해둔 생일 정보로 빠르게 등록했어요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                await Birthdays.findOneAndUpdate(
                    { _id: interaction.user.id, "guilds._id": interaction.guildId },
                    {
                        $set: {
                            "guilds.$.allowShowAge": JSON.parse(interaction.options.getString("나이공개", true)) ? true : false,
                        },
                    }
                );
                return await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.primary,
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL(),
                            },
                            title: `<:cakeprogress:985470905314603018> 나이가 ${JSON.parse(interaction.options.getString("나이공개", true)) ? "공개" : "비공개"}된 생일을 공유하도록 설정했어요`,
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                });
            }
            case "서버설정": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                if (!userData.guilds.find((guild) => interaction.guildId == guild._id)) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.primary,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:cakeprogress00:985470906891632701> 이미 서버에 생일이 등록되어있지 않아요.",
                                description: "만약 이 서버에서 생일을 공유하고 싶으시다면 `/생일 등록` 명령어를 사용해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                await Birthdays.findByIdAndUpdate(interaction.user.id, {
                    _id: interaction.user.id,
                    $pull: { guilds: { _id: interaction.guildId } },
                });
                await Settings.findByIdAndUpdate(interaction.guildId, {
                    $pull: { members: interaction.user.id },
                });
                await sendLogMessage(interaction.guildId, "unregister", interaction.user.id);
                return await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.primary,
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL(),
                            },
                            title: "<:cakeprogress00:985470906891632701> 이 서버에서 생일을 공유하지 않도록 설정했어요",
                            description: "만약 이 서버에서 생일 공유와 알림을 받고싶으시다면 `/생일 등록` 명령어를 사용해주세요.",
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                });
            }
            case "삭제": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.primary,
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL(),
                            },
                            title: "<:cakeprogress:985470905314603018> 정말 생일 정보를 삭제할까요?",
                            description: "생일 정보가 **모든 서버에서 삭제**될거예요.",
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: "아니요",
                                    emoji: "<:cakeprogress:985470905314603018>",
                                    style: 2,
                                    customId: "delete-false",
                                },
                                {
                                    type: 2,
                                    label: "삭제",
                                    emoji: "<:cakeprogress00:985470906891632701>",
                                    style: 4,
                                    customId: "delete-true",
                                },
                            ],
                        },
                    ],
                });
                break;
            }
            case "등록": {
                if (interaction.options.getString("나이공개", true) != "true" && interaction.options.getString("나이공개", true) != "false") {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.error,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:xbold:985419129316065320> 나이공개 옵션이 잘못 입력되었어요",
                                description: "옵션을 입력하지 말고 눌러서 선택해주세요.",
                                image: {
                                    url: "https://i.ibb.co/rdpGVVZ/2-allow-Show-Age-typing.png",
                                },
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                if (userData && userData.date) {
                    if (userData.guilds.find((guild) => interaction.guildId == guild._id)) {
                        return await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: Colors.primary,
                                    author: {
                                        name: interaction.member.nickname || interaction.user.username,
                                        icon_url: interaction.user.displayAvatarURL(),
                                    },
                                    title: "<:cakeprogress:985470905314603018> 이미 생일이 등록되어있어요!",
                                    description: "만약 생일을 변경하려 하신다면 `/생일 변경` 명령어를 사용해주세요.",
                                    footer: { text: `${interaction.user.id}` },
                                },
                            ],
                        });
                    }
                    const roles = [];
                    if (guildSetting.subRole) {
                        const zodiac = getZodiac(userData.date);
                        const zodiacRoleId = guildSetting.zodiacRoles.find(obj => obj._id === zodiac.id)?.roleId;
                        const zodiacRole = zodiacRoleId ? await interaction.guild.roles.fetch(zodiacRoleId) : undefined;
                        if (!zodiacRole) {
                            const role = await interaction.guild.roles.create({
                                name: `${zodiac.emoji} ${zodiac.name}`,
                                color: zodiac.color,
                                hoist: false,
                            });
                            roles.push(role.id);
                            await Settings.findByIdAndUpdate(interaction.guildId, {
                                $addToSet: { zodiacRoles: { _id: zodiac.id, roleId: role.id } },
                            });
                            await interaction.member.roles.add(role);
                        } else {
                            roles.push(zodiacRole.id);
                            await interaction.member.roles.add(zodiacRole);
                        }

                        const birthStone = getBirthstone(userData.date);
                        const birthstoneRoleId = guildSetting.birthstoneRoles.find(obj => obj._id === birthStone.id)?.roleId;
                        const birthstoneRole = birthstoneRoleId ? await interaction.guild.roles.fetch(birthstoneRoleId) : undefined;
                        if (!birthstoneRole) {
                            const role = await interaction.guild.roles.create({
                                name: birthStone.name,
                                color: birthStone.color,
                                hoist: false,
                            });
                            roles.push(role.id);
                            await Settings.findByIdAndUpdate(interaction.guildId, {
                                $addToSet: { birthstoneRoles: { _id: birthStone.id, roleId: role.id } },
                            });
                            await interaction.member.roles.add(role);
                        } else {
                            roles.push(birthstoneRole.id);
                            await interaction.member.roles.add(birthstoneRole);
                        }

                    }

                    await Birthdays.findByIdAndUpdate(interaction.user.id, {
                        _id: interaction.user.id,
                        $addToSet: { roles: { $each: roles }, guilds: { _id: interaction.guildId, allowShowAge: guildSetting.allowHideAge ? JSON.parse(interaction.options.getString("나이공개", true)) : true } },
                    });
                    await Settings.findByIdAndUpdate(interaction.guildId, {
                        $addToSet: { members: interaction.user.id },
                    });
                    await sendLogMessage(interaction.guildId, "register", interaction.user.id, { birthday: userData.date, allowShowAge: guildSetting.allowHideAge ? JSON.parse(interaction.options.getString("나이공개", true)) : true });
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: Colors.primary,
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL(),
                                },
                                title: "<:cakeprogress:985470905314603018> 이 서버에서도 생일을 공유하도록 설정했어요",
                                description: "이미 등록해둔 생일 정보로 빠르게 등록했어요.",
                                fields: [
                                    {
                                        name: "이 서버에서는 생일을 공유하고 싶지 않은 경우",
                                        value: "`/생일 서버설정` 명령어를 사용하시면 그 서버에서는 생일을 공유하지 않도록 설정할게요.",
                                        inline: false,
                                    },
                                ],
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                const today = new Date();
                await interaction.showModal({
                    title: "생일 등록",
                    customId: `birthday-${guildSetting.allowHideAge ? JSON.parse(interaction.options.getString("나이공개", true)) : true}-${interaction.user.id}`,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    customId: "birthday",
                                    label: `${
                                        today.getFullYear() +
                                        (today.getMonth() + 1 > 9 ? (today.getMonth() + 1).toString() : "0" + (today.getMonth() + 1)) +
                                        (today.getDate() > 9 ? today.getDate().toString() : "0" + today.getDate().toString())
                                    } 형식으로 입력해주세요.`,
                                    style: 1,
                                    minLength: 8,
                                    maxLength: 8,
                                    placeholder:
                                        today.getFullYear() +
                                        (today.getMonth() + 1 > 9 ? (today.getMonth() + 1).toString() : "0" + (today.getMonth() + 1)) +
                                        (today.getDate() > 9 ? today.getDate().toString() : "0" + today.getDate().toString()),
                                    required: true,
                                },
                            ],
                        },
                    ],
                });
            }
        }
    },
};
