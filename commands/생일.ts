import { Interaction } from "discord.js";
import { Client, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton, Role, TextChannel } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { saveChannel, getZodiac, getBirthstone } from "../utils/function";
import { getLocaleString as t } from "../utils/localization";

module.exports = {
    name: "생일",
    description: "내 생일을 등록하거나 관리해요",
    options: [
        {
            name: "등록",
            description: "내 생일을 등록하고 멤버들의 축하를 받아보세요! (나이는 비공개할 수 있어요)",
            type: "SUB_COMMAND",
        },
        {
            name: "삭제",
            description: "등록했던 내 생일을 삭제해요.",
            type: "SUB_COMMAND",
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        // 길드의 설정 정보 가져오기
        const settingData = await Settings.findById(interaction.guild.id);

        if (!settingData || !settingData.isSetup) {
            return await interaction.reply({
                ephemeral: true,
                embeds: [
                    {
                        color: "#f56969",
                        title: "<:xbold:985419129316065320> 생일 알림 기본 셋업이 되어있지 않아요!",
                        description: "서버 관리자가 직접 `/생일알림 셋업`명령어를 이용해 셋업을 진행해야 사용할 수 있어요.",
                        fields: [
                            {
                                name: "해결법",
                                value: interaction.member.permissions.has(["ADMINISTRATOR"]) ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요!" : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요!",
                                inline: false,
                            },
                        ],
                        footer: { text: interaction.guild.id },
                    },
                ],
            });
        }

        switch (interaction.options.getSubcommand()) {
            case "등록": {
                const today = new Date();
                await interaction.showModal({
                    title: "생일 등록",
                    customId: `${interaction.id}-birthday`,
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
                                    } 형식
(나이는 비공개할 수 있어요)`,
                                    style: 1,
                                    min_length: 8,
                                    max_length: 8,
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

        client.on("interactionCreate", async (i: Interaction) => {
            if (!i.isModalSubmit()) return;
            if (!i.customId.startsWith(interaction.id)) return;
            const options = i.customId.split("-");
            switch (options[1]) {
                case "birthday": {
                    const rawDate = i.fields.getTextInputValue("birthday");
                    const year = Number(rawDate.substring(0, 4));
                    if (year > new Date().getFullYear()) {
                        return await i.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: "#f5bed1",
                                    author: {
                                        name: interaction.member.nickname || interaction.user.username,
                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                    },
                                    title: "<:xbold:985419129316065320> 뭔가 이상하네요...",
                                    description: "실수로 잘못 입력하신거죠?",
                                    fields: [
                                        {
                                            name: "해결법",
                                            value: "YYYYMMDD 형식으로 생일을 바르게 입력해주세요! (나이는 비공개할 수 있어요)",
                                            inline: false,
                                        },
                                    ],
                                    footer: { text: `${interaction.guildId}` },
                                },
                            ],
                        });
                    }
                    const month = Number(rawDate.substring(4, 6));
                    const day = Number(rawDate.substring(6, 8));
                    const birthday = new Date(year, month - 1, day + 0);
                    const date2 = `${birthday.getFullYear()}년 ${("0" + (birthday.getMonth() + 1)).slice(-2)}월 ${("0" + birthday.getDate()).slice(-2)}일`;
                    await i.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: "#f56969",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: `<:cakeprogress00:985470906891632701> ${date2}`,
                                description: "나이를 🔒비공개 처리 할까요?",
                                fields: [
                                    {
                                        name: "공개",
                                        value: "다른 사람이 내 나이를 확인할 수 있고 생일 알림에 나이가 공개될 거예요.",
                                        inline: false,
                                    },
                                    {
                                        name: "🔒비공개",
                                        value: "다른 사람에게 나이를 알리지 않을게요.",
                                    },
                                    {
                                        name: "\u200B",
                                        value: "이 설정은 언제나 변경할 수 있어요.",
                                    },
                                ],
                                footer: { text: `${interaction.guildId} 생일을 잘못 입력했다면 메시지 닫기 후 명령어를 다시 사용해주세요.` },
                            },
                        ],
                        components: [
                            new MessageActionRow().addComponents(
                                new MessageButton().setCustomId(`${interaction.id}-privateAge-true`).setLabel("공개").setStyle("SECONDARY"),
                                new MessageButton().setCustomId(`${interaction.id}-privateAge-false`).setLabel("🔒비공개").setStyle("PRIMARY")
                            ),
                        ],
                    });

                    const filter = (ii: MessageComponentInteraction) => ii.customId.startsWith(interaction.id);

                    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 300000 });
                    collector?.on("collect", async (ii: MessageComponentInteraction) => {
                        const options = ii.customId.split("-");
                        switch (options[1]) {
                            case "privateAge": {
                                await ii.deferUpdate();
                                await Birthdays.findByIdAndUpdate(
                                    interaction.user.id,
                                    {
                                        _id: interaction.user.id,
                                        date: birthday,
                                        allowShowAge: JSON.parse(options[2]),
                                    },
                                    { upsert: true }
                                );
                                if (settingData.subRole) {
                                    await i.editReply({
                                        embeds: [
                                            {
                                                color: "#f5bed1",
                                                author: {
                                                    name: interaction.member?.nickname || interaction.user.username,
                                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                },
                                                title: "<:cakeprogress02:985470913938071642> 별자리, 탄생석 역할을 추가해드릴까요?",
                                                description: "별자리와 탄생석에 관심이 많으시다면 좋은 선택이 될 거예요.",
                                                fields: [
                                                    {
                                                        name: "아니요",
                                                        value: "탄생석 및 별자리 기능을 사용하지 않아요.",
                                                        inline: false,
                                                    },
                                                    {
                                                        name: "네",
                                                        value: `서버 설정에 따른 **${getZodiac(birthday).name}, ${getBirthstone(birthday).name}** 역할을 추가해드릴게요.`,
                                                    },
                                                ],
                                                footer: { text: `${interaction.guildId}` },
                                            },
                                        ],
                                        components: [
                                            new MessageActionRow().addComponents(
                                                new MessageButton().setCustomId(`${interaction.id}-subrole-false`).setLabel("아니요").setStyle("SECONDARY"),
                                                new MessageButton().setCustomId(`${interaction.id}-subrole-true`).setLabel("네").setStyle("PRIMARY")
                                            ),
                                        ],
                                    });
                                    return;
                                } else {
                                    if (settingData.allowCreateThread) {
                                        await i.editReply({
                                            embeds: [
                                                {
                                                    color: "#f5bed1",
                                                    author: {
                                                        name: interaction.member.nickname || interaction.user.username,
                                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                    },
                                                    title: "<:cakeprogress03:985470915540291624> 생일날에 개인 채널(스레드)을 따로 만들어드릴까요?",
                                                    description: "롤링 페이퍼를 받는 느낌일 거예요!",
                                                    fields: [
                                                        {
                                                            name: "아니요",
                                                            value: "그냥 생일 알림만 전송할게요.",
                                                            inline: false,
                                                        },
                                                        {
                                                            name: "네",
                                                            value: `생일날이 되면 ${interaction.member.nickname || interaction.user.username}님을 위한 채널(스레드)을 만들어드릴게요.`,
                                                        },
                                                        {
                                                            name: "\u200B",
                                                            value: "생일이 지나면 자동으로 보관 처리 될 거예요.",
                                                        },
                                                    ],
                                                    footer: { text: `${interaction.guildId}` },
                                                },
                                            ],
                                            components: [
                                                new MessageActionRow().addComponents(
                                                    new MessageButton().setCustomId(`${interaction.id}-thread-false`).setLabel("아니요").setStyle("SECONDARY"),
                                                    new MessageButton().setCustomId(`${interaction.id}-thread-true`).setLabel("네").setStyle("PRIMARY")
                                                ),
                                            ],
                                        });
                                    } else {
                                        await i.editReply({
                                            content: "끝?",
                                            embeds: [],
                                            components: [],
                                        });
                                        break;
                                    }
                                }
                                return;
                            }
                            case "subrole": {
                                await ii.deferUpdate();
                                if (options[2] !== "false") {
                                    //
                                    const zodiac = getZodiac(birthday);
                                    const birthstone = getBirthstone(birthday);
                                    let role: any;
                                    const existingZodiacRole: { name: string; _id: string } | undefined = settingData.zodiacRoles.find((role) => role.name == zodiac.name);
                                    if (existingZodiacRole) {
                                        role = await interaction.guild.roles.fetch(existingZodiacRole?._id);
                                    }
                                    if (!role || !existingZodiacRole) {
                                        role = await interaction.guild.roles.create({
                                            name: `${zodiac.emoji} ${zodiac.name}`,
                                            permissions: [],
                                            color: zodiac.color,
                                        });
                                    }
                                    if (!interaction.member.roles.cache.find((r) => r.id == role.id)) {
                                        await Birthdays.findByIdAndUpdate(
                                            interaction.user.id,
                                            {
                                                _id: interaction.user.id,
                                                $push: { roles: role.id },
                                            },
                                            { upsert: true }
                                        );
                                    }
                                    await interaction.member.roles.add(role);
                                    if (!existingZodiacRole) {
                                        await Settings.findByIdAndUpdate(
                                            interaction.guildId,
                                            {
                                                _id: interaction.guildId,
                                                $push: { zodiacRoles: { name: zodiac.name, _id: role.id } },
                                            },
                                            { upsert: true }
                                        );
                                    }
                                    const existingBirthstonecRole: { name: string; _id: string } | undefined = settingData.birthstoneRoles.find((role) => role.name == birthstone.name);
                                    if (existingBirthstonecRole) {
                                        role = await interaction.guild.roles.fetch(existingBirthstonecRole?._id);
                                    }
                                    if (!role || !existingBirthstonecRole) {
                                        role = await interaction.guild.roles.create({
                                            name: `${birthstone.name}`,
                                            permissions: [],
                                            color: birthstone.color,
                                        });
                                    }
                                    if (!interaction.member.roles.cache.find((r) => r.id == role.id)) {
                                        await Birthdays.findByIdAndUpdate(
                                            interaction.user.id,
                                            {
                                                _id: interaction.user.id,
                                                $push: { roles: role.id },
                                            },
                                            { upsert: true }
                                        );
                                    }
                                    await interaction.member.roles.add(role);
                                    if (!existingBirthstonecRole) {
                                        await Settings.findByIdAndUpdate(
                                            interaction.guildId,
                                            {
                                                _id: interaction.guildId,
                                                $push: { birthstoneRoles: { name: birthstone.name, _id: role.id } },
                                            },
                                            { upsert: true }
                                        );
                                    }
                                    await Birthdays.findByIdAndUpdate(
                                        interaction.user.id,
                                        {
                                            _id: interaction.user.id,
                                            $push: { roles: role.id },
                                        },
                                        { upsert: true }
                                    );
                                    if (settingData.allowCreateThread) {
                                        await i.editReply({
                                            embeds: [
                                                {
                                                    color: "#f5bed1",
                                                    author: {
                                                        name: interaction.member.nickname || interaction.user.username,
                                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                    },
                                                    title: "<:cakeprogress03:985470915540291624> 생일날에 개인 채널(스레드)을 따로 만들어드릴까요?",
                                                    description: "롤링 페이퍼를 받는 느낌일 거예요!",
                                                    fields: [
                                                        {
                                                            name: "아니요",
                                                            value: "그냥 생일 알림만 전송할게요.",
                                                            inline: false,
                                                        },
                                                        {
                                                            name: "네",
                                                            value: `생일날이 되면 ${interaction.member.nickname || interaction.user.username}님을 위한 채널(스레드)을 만들어드릴게요.`,
                                                        },
                                                        {
                                                            name: "\u200B",
                                                            value: "생일이 지나면 자동으로 보관 처리 될 거예요.",
                                                        },
                                                    ],
                                                    footer: { text: `${interaction.guildId}` },
                                                },
                                            ],
                                            components: [
                                                new MessageActionRow().addComponents(
                                                    new MessageButton().setCustomId(`${interaction.id}-thread-false`).setLabel("아니요").setStyle("SECONDARY"),
                                                    new MessageButton().setCustomId(`${interaction.id}-thread-true`).setLabel("네").setStyle("PRIMARY")
                                                ),
                                            ],
                                        });
                                    } else {
                                        await i.editReply({
                                            content: "끝?",
                                            embeds: [],
                                            components: [],
                                        });
                                        break;
                                    }
                                }
                                if (settingData.allowCreateThread) {
                                    await i.editReply({
                                        embeds: [
                                            {
                                                color: "#f5bed1",
                                                author: {
                                                    name: interaction.member.nickname || interaction.user.username,
                                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                },
                                                title: "<:cakeprogress03:985470915540291624> 생일날에 개인 채널(스레드)을 따로 만들어드릴까요?",
                                                description: "롤링 페이퍼를 받는 느낌일 거예요!",
                                                fields: [
                                                    {
                                                        name: "아니요",
                                                        value: "그냥 생일 알림만 전송할게요.",
                                                        inline: false,
                                                    },
                                                    {
                                                        name: "네",
                                                        value: `생일날이 되면 ${interaction.member.nickname || interaction.user.username}님을 위한 채널(스레드)을 만들어드릴게요.`,
                                                    },
                                                    {
                                                        name: "\u200B",
                                                        value: "생일이 지나면 자동으로 보관 처리 될 거예요.",
                                                    },
                                                ],
                                                footer: { text: `${interaction.guildId}` },
                                            },
                                        ],
                                        components: [
                                            new MessageActionRow().addComponents(
                                                new MessageButton().setCustomId(`${interaction.id}-thread-false`).setLabel("아니요").setStyle("SECONDARY"),
                                                new MessageButton().setCustomId(`${interaction.id}-thread-true`).setLabel("네").setStyle("PRIMARY")
                                            ),
                                        ],
                                    });
                                } else {
                                    await i.editReply({
                                        content: "끝?",
                                        embeds: [],
                                        components: [],
                                    });
                                    break;
                                }
                                return;
                            }
                            case "thread": {
                                await ii.deferUpdate();
                                await Birthdays.findByIdAndUpdate(interaction.user.id, {
                                    _id: interaction.user.id,
                                    date: birthday,
                                    allowCreateThread: JSON.parse(options[2]),
                                });
                                await i.editReply({
                                    content: "끝?",
                                    embeds: [],
                                    components: [],
                                });
                                break;
                            }
                        }
                    });
                    return;
                }
            }
        });

        // const message = await channel.send({ content: "@here 오늘은 테스트님의 생일이에요! 생일을 축하하는 메시지 하나 남겨보는건 어떨까요?" });
        // const thread = await message.startThread({
        //     name: "테스트님의 생일",
        //     autoArchiveDuration: 1440,
        //     reason: "테스트님의 생일",
        // });
        // await threatoday.members.add("868814766225887232");
        // await threatoday.send({ content: "테스트님 생일 축하드려요!🎉 즐겁고 행복한 하루 보내시길 바라요!" });

        // console.log(`Created thread: ${threatoday.name}`);
    },
};
