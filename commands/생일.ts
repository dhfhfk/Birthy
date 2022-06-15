import { Interaction } from "discord.js";
import { Client, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton } from "discord.js";
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
            name: "변경",
            description: "내 생일을 변경해요. (최대 두 번 변경 가능해요)",
            type: "SUB_COMMAND",
        },
        {
            name: "삭제",
            description: "등록했던 내 생일을 삭제해요.",
            type: "SUB_COMMAND",
        },
        {
            name: "서버설정",
            description: "이 서버에서 생일 알림을 받을지 설정할 수 있어요.",
            type: "SUB_COMMAND",
        },
        {
            name: "설정",
            description: "내 생일에 관련된 설정",
            type: "SUB_COMMAND",
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        // 설정 정보 가져오기
        const settingData = await Settings.findById(interaction.guild.id);
        const userData = await Birthdays.findById(interaction.user.id);

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
            case "삭제": {
                if (!userData || !userData.date) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: "#f56969",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: "<:xbold:985419129316065320> 등록된 생일 정보가 없어요!",
                                description: "같이 해결해봐요.",
                                fields: [
                                    {
                                        name: "해결법",
                                        value: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요!",
                                        inline: false,
                                    },
                                ],
                                footer: { text: `${interaction.guildId}` },
                            },
                        ],
                    });
                }
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: "#f5bed1",
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                            },
                            title: "<:cakeprogress:985470905314603018> 정말 생일 정보를 삭제할까요?",
                            fields: [
                                {
                                    name: "삭제",
                                    value: "생일 정보를 삭제할게요.",
                                    inline: false,
                                },
                                {
                                    name: "아니요",
                                    value: "생일 정보 삭제를 취소해요.",
                                },
                            ],
                            footer: { text: `${interaction.guildId}` },
                        },
                    ],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setCustomId(`${interaction.id}-delete-true`).setLabel("삭제").setStyle("DANGER"),
                            new MessageButton().setCustomId(`${interaction.id}-delete-false`).setLabel("아니오").setStyle("SECONDARY")
                        ),
                    ],
                });
                break;
            }
            case "등록": {
                if (userData && userData.date) {
                    if (userData.guilds.find((guild) => interaction.guildId == guild)) {
                        return await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: "#f5bed1",
                                    author: {
                                        name: interaction.member.nickname || interaction.user.username,
                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                    },
                                    title: "<:cakeprogress:985470905314603018> 이미 생일이 등록되어있어요!",
                                    description: "만약 생일을 변경하려 하시려면 아래의 설명을 따라가주세요.",
                                    fields: [
                                        {
                                            name: "생일 변경하기",
                                            value: "`/생일 변경` 명령어를 사용해 생일을 바꿀 수 있어요",
                                            inline: false,
                                        },
                                    ],
                                    footer: { text: `${interaction.guildId}` },
                                },
                            ],
                        });
                    }
                    await Birthdays.findByIdAndUpdate(interaction.user.id, {
                        _id: interaction.user.id,
                        $push: { guilds: interaction.guildId },
                    });
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                color: "#f5bed1",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: "<:cakeprogress:985470905314603018> 이 서버에서도 생일 알림을 받도록 설정했어요.",
                                description: "이미 등록해둔 생일 정보로 생일 알림을 등록했어요.",
                                fields: [
                                    {
                                        name: "이 서버에서는 생일 알림을 받고싶지 않을 경우",
                                        value: "`/생일 서버설정` 명령어를 사용하시면 그 서버에서는 생일 알림을 보내지 않도록 설정할게요.",
                                        inline: false,
                                    },
                                ],
                                footer: { text: `${interaction.guildId}` },
                            },
                        ],
                    });
                }
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
            if (!i.isModalSubmit() && !i.isButton()) return;
            if (!i.customId.startsWith(interaction.id)) return;
            const options = i.customId.split("-");
            switch (options[1]) {
                case "delete": {
                    if (options[2] == "false") {
                        await interaction.editReply({ content: "생일 삭제를 취소했어요.", embeds: [], components: [] });
                        return;
                    }
                    try {
                        userData?.roles.forEach(async (role) => {
                            await interaction.member.roles.remove(role);
                        });
                    } catch (e) {
                        //
                    }
                    await Birthdays.findByIdAndUpdate(interaction.user.id, {
                        $unset: { date: 1, roles: 1, guilds: 1, allowCreateThread: 1, allowShowAge: 1 },
                    });
                    await interaction.editReply({ content: "생일 삭제를 완료했습니다.", embeds: [], components: [] });
                    return;
                }
                case "birthday": {
                    if (!i.isModalSubmit()) return;
                    const rawDate = i.fields.getTextInputValue("birthday");
                    const year = Number(rawDate.substring(0, 4));
                    if (year > new Date().getFullYear()) {
                        return await i.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: "#f56969",
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
                                color: "#f5bed1",
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

                    if (userData && !userData.guilds.find((guild) => interaction.guildId == guild)) {
                        await Birthdays.findByIdAndUpdate(
                            interaction.user.id,
                            {
                                _id: interaction.user.id,
                                $push: { guilds: interaction.guildId },
                            },
                            { upsert: true }
                        );
                    }

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
                                        lastModifiedAt: new Date(),
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
                                            embeds: [
                                                {
                                                    color: "#f5bed1",
                                                    author: {
                                                        name: interaction.member.nickname || interaction.user.username,
                                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                    },
                                                    title: "<:cakeprogress:985470905314603018> 생일을 등록했어요!",
                                                    description: "이제 이 서버에서 생일 알림을 받을 수 있어요.",
                                                    fields: [
                                                        {
                                                            name: "Q. 다른 서버에서도 생일 알림이 전송되나요?",
                                                            value: "`/생일 등록` 명령어를 사용한 서버에서만 생일 알림이 전송될 거예요.\n만약 특정 서버에서 알림을 받고싶지 않으시다면 `/생일 서버설정` 명령어를 사용해주세요.",
                                                            inline: false,
                                                        },
                                                    ],
                                                    footer: { text: `${interaction.guildId}` },
                                                },
                                            ],
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
                                            embeds: [
                                                {
                                                    color: "#f5bed1",
                                                    author: {
                                                        name: interaction.member.nickname || interaction.user.username,
                                                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                    },
                                                    title: "<:cakeprogress:985470905314603018> 생일을 등록했어요!",
                                                    description: "이제 이 서버에서 생일 알림을 받을 수 있어요.",
                                                    fields: [
                                                        {
                                                            name: "Q. 다른 서버에서도 생일 알림이 전송되나요?",
                                                            value: "`/생일 등록` 명령어를 사용한 서버에서만 생일 알림이 전송될 거예요.\n만약 특정 서버에서 알림을 받고싶지 않으시다면 `/생일 서버설정` 명령어를 사용해주세요.",
                                                            inline: false,
                                                        },
                                                    ],
                                                    footer: { text: `${interaction.guildId}` },
                                                },
                                            ],
                                            components: [],
                                        });
                                        return;
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
                                        embeds: [
                                            {
                                                color: "#f5bed1",
                                                author: {
                                                    name: interaction.member.nickname || interaction.user.username,
                                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                                },
                                                title: "<:cakeprogress:985470905314603018> 생일을 등록했어요!",
                                                description: "이제 이 서버에서 생일 알림을 받을 수 있어요.",
                                                fields: [
                                                    {
                                                        name: "Q. 다른 서버에서도 생일 알림이 전송되나요?",
                                                        value: "`/생일 등록` 명령어를 사용한 서버에서만 생일 알림이 전송될 거예요.\n만약 특정 서버에서 알림을 받고싶지 않으시다면 `/생일 서버설정` 명령어를 사용해주세요.",
                                                        inline: false,
                                                    },
                                                ],
                                                footer: { text: `${interaction.guildId}` },
                                            },
                                        ],
                                        components: [],
                                    });
                                    return;
                                }
                                return;
                            }
                            case "thread": {
                                await ii.deferUpdate();
                                await Birthdays.findByIdAndUpdate(interaction.user.id, {
                                    _id: interaction.user.id,
                                    date: birthday,
                                    lastModifiedAt: new Date(),
                                    allowCreateThread: JSON.parse(options[2]),
                                });
                                await i.editReply({
                                    embeds: [
                                        {
                                            color: "#f5bed1",
                                            author: {
                                                name: interaction.member.nickname || interaction.user.username,
                                                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                            },
                                            title: "<:cakeprogress:985470905314603018> 생일을 등록했어요!",
                                            description: "이제 이 서버에서 생일 알림을 받을 수 있어요.",
                                            fields: [
                                                {
                                                    name: "Q. 다른 서버에서도 생일 알림이 전송되나요?",
                                                    value: "`/생일 등록` 명령어를 사용한 서버에서만 생일 알림이 전송될 거예요.\n만약 특정 서버에서 알림을 받고싶지 않으시다면 `/생일 서버설정` 명령어를 사용해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: `${interaction.guildId}` },
                                        },
                                    ],
                                    components: [],
                                });
                                return;
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
