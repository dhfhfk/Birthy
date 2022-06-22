import { Client, Interaction, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { getLocaleString as t } from "../utils/localization";

module.exports = {
    name: "생일",
    description: "내 생일을 등록하거나 관리해요",
    options: [
        {
            name: "등록",
            description: "내 생일을 등록하고 멤버들의 축하를 받아보세요!",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "나이공개",
                    description: "다른 멤버에게 나이를 공개할까요? (서버 설정에 따름)",
                    type: "STRING",
                    autocomplete: true,
                    required: true,
                },
            ],
        },
        {
            name: "변경",
            description: "내 생일을 변경해요. (한 달에 한 번 변경 가능해요)",
            type: "SUB_COMMAND",
        },
        {
            name: "삭제",
            description: "등록했던 내 생일을 삭제해요.",
            type: "SUB_COMMAND",
        },
        {
            name: "서버",
            description: "이 서버에서 생일 알림을 받지 않도록 설정해요.",
            type: "SUB_COMMAND",
        },
        {
            name: "공개설정",
            description: "이 서버에서 생일을 공개할지 설정해요.",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "나이공개",
                    description: "다른 멤버에게 나이를 공개할까요? (서버 설정에 따름)",
                    type: "STRING",
                    autocomplete: true,
                    required: true,
                },
            ],
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        // 설정 정보 가져오기
        const guildSetting = await Settings.findById(interaction.guild.id);
        const userData = await Birthdays.findById(interaction.user.id);
        let change = false;

        if (!guildSetting || !guildSetting.isSetup) {
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
                                value: interaction.member.permissions.has(["ADMINISTRATOR"]) ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요." : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요.",
                                inline: false,
                            },
                        ],
                        footer: { text: interaction.guild.id },
                    },
                ],
            });
        }

        switch (interaction.options.getSubcommand()) {
            case "변경": {
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
                                color: "#f56969",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: "<:xbold:985419129316065320> 더이상 생일을 변경할 수 없어요.",
                                description: `<t:${Math.floor(remaining.getTime() / 1000).toFixed(0)}:R> 에 다시 변경할 수 있어요.`,
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                change = true;
                const today = new Date();
                await interaction.showModal({
                    title: "생일 등록",
                    customId: `${interaction.id}-birthday-change`,
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

                break;
            }
            case "공개설정": {
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
                                description: "`/생일 등록` 명령어를 이용해 생일을 등록해주세요.",
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
                                color: "#f5bed1",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: `<:cakeprogress:985470905314603018> 나이가 ${JSON.parse(interaction.options.getString("나이공개", true)) ? "공개" : "비공개"}된 생일 알림을 받도록 설정했어요`,
                                description: "이미 등록해둔 생일 정보로 생일 알림을 등록했어요.",
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
                            color: "#f5bed1",
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                            },
                            title: `<:cakeprogress:985470905314603018> 나이가 ${JSON.parse(interaction.options.getString("나이공개", true)) ? "공개" : "비공개"}된 생일 알림을 받도록 설정했어요`,
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                });
            }
            case "서버": {
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
                                color: "#f5bed1",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                title: "<:cakeprogress00:985470906891632701> 이미 서버에 생일 알림이 등록되어있지 않아요.",
                                description: "만약 이 서버에서 생일 알림을 받고싶으시다면 `/생일 등록` 명령어를 사용해주세요.",
                                footer: { text: `${interaction.user.id}` },
                            },
                        ],
                    });
                }
                await Birthdays.findByIdAndUpdate(interaction.user.id, {
                    _id: interaction.user.id,
                    $pull: { guilds: { _id: interaction.guildId } },
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
                            title: "<:cakeprogress00:985470906891632701> 이 서버에서 알림을 받지 않도록 설정했어요",
                            description: "만약 이 서버에서 생일 알림을 받고싶으시다면 `/생일 등록` 명령어를 사용해주세요.",
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
                                color: "#f56969",
                                author: {
                                    name: interaction.member.nickname || interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
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
                            color: "#f5bed1",
                            author: {
                                name: interaction.member.nickname || interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                            },
                            title: "<:cakeprogress:985470905314603018> 정말 생일 정보를 삭제할까요?",
                            description: "생일 정보가 모든 서버에서 삭제될거예요.",
                            footer: { text: `${interaction.user.id}` },
                        },
                    ],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setCustomId(`${interaction.id}-delete-false`).setLabel("아니오").setStyle("SECONDARY").setEmoji("<:cakeprogress:985470905314603018>"),
                            new MessageButton().setCustomId(`${interaction.id}-delete-true`).setLabel("삭제").setStyle("DANGER").setEmoji("<:cakeprogress00:985470906891632701>")
                        ),
                    ],
                });
                break;
            }
            case "등록": {
                if (userData && userData.date) {
                    if (userData.guilds.find((guild) => interaction.guildId == guild._id)) {
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
                                    description: "만약 생일을 변경하고 싶으시다면 `/생일 변경` 명령어를 사용해주세요.",
                                    footer: { text: `${interaction.user.id}` },
                                },
                            ],
                        });
                    }
                    await Birthdays.findByIdAndUpdate(interaction.user.id, {
                        _id: interaction.user.id,
                        $push: { guilds: { _id: interaction.guildId, allowShowAge: guildSetting.allowHideAge ? JSON.parse(interaction.options.getString("나이공개", true)) : true } },
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
                                title: "<:cakeprogress:985470905314603018> 이 서버에서도 생일 알림을 받도록 설정했어요",
                                description: "이미 등록해둔 생일 정보로 생일 알림을 등록했어요.",
                                fields: [
                                    {
                                        name: "이 서버에서는 생일 알림을 받고싶지 않을 경우",
                                        value: "`/생일 서버설정` 명령어를 사용하시면 그 서버에서는 생일 알림을 보내지 않도록 설정할게요.",
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
                                    } 형식으로 입력해주세요.`,
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
                        $unset: { date: 1, roles: 1, guilds: 1, allowCreateThread: 1, month: 1, day: 1 },
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
                                            value: "YYYYMMDD 형식으로 생일을 바르게 입력해주세요!",
                                            inline: false,
                                        },
                                    ],
                                    footer: { text: `${interaction.user.id}` },
                                },
                            ],
                        });
                    }
                    const month = Number(rawDate.substring(4, 6));
                    const day = Number(rawDate.substring(6, 8));
                    const birthday = new Date(year, month - 1, day + 0);
                    birthday.setHours(birthday.getHours() + 9);
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
                                description: "생일을 맞게 입력하셨나요?",
                                fields: [
                                    {
                                        name: "\u200B",
                                        value: "생일을 잘못 입력했다면 메시지 닫기 후 명령어를 다시 사용해주세요.",
                                    },
                                ],
                                footer: { text: interaction.user.id },
                            },
                        ],
                        components: [
                            new MessageActionRow().addComponents(
                                new MessageButton().setCustomId(`${interaction.id}-correctAge-false`).setLabel("잘못됐어요").setStyle("SECONDARY").setEmoji("<:xbold:985419129316065320>"),
                                new MessageButton().setCustomId(`${interaction.id}-correctAge-true`).setLabel("맞아요").setStyle("PRIMARY").setEmoji("<:cakeprogress:985470905314603018>")
                            ),
                        ],
                    });
                    const filter = (i: MessageComponentInteraction) => i.customId.startsWith(interaction.id);

                    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 300000 });
                    collector?.on("collect", async (ii: MessageComponentInteraction) => {
                        const options = ii.customId.split("-");
                        if (!options[0].startsWith(interaction.id)) return;
                        switch (options[1]) {
                            case "correctAge": {
                                if (!JSON.parse(options[2])) {
                                    await i.editReply({ content: "`/생일 등록` 명령어를 다시 사용해주세요.", embeds: [], components: [] });
                                    return;
                                }
                                if (change) {
                                    await Birthdays.findByIdAndUpdate(
                                        interaction.user.id,
                                        {
                                            _id: interaction.user.id,
                                            lastModifiedAt: new Date(),
                                            $inc: { modifiedCount: 1 },
                                            date: birthday,
                                            month: ("0" + (birthday.getMonth() + 1)).slice(-2),
                                            day: ("0" + birthday.getDate()).slice(-2),
                                        },
                                        { upsert: true }
                                    );
                                    const decModifiedCount = client.jobs.create("dec modifiedCount", { userId: interaction.user.id });
                                    decModifiedCount.schedule("1 month after");
                                    await decModifiedCount.save();
                                } else {
                                    await Birthdays.findByIdAndUpdate(
                                        interaction.user.id,
                                        {
                                            _id: interaction.user.id,
                                            lastModifiedAt: new Date(),
                                            modifiedCount: 0,
                                            date: birthday,
                                            month: ("0" + (birthday.getMonth() + 1)).slice(-2),
                                            day: ("0" + birthday.getDate()).slice(-2),
                                            $push: { guilds: { _id: interaction.guildId, allowShowAge: guildSetting.allowHideAge ? JSON.parse(interaction.options.getString("나이공개", true)) : true } },
                                        },
                                        { upsert: true }
                                    );
                                }
                                await ii.deferUpdate();
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
                                                    value: "`/생일 등록` 명령어를 사용하면 그 서버에서도 생일 알림이 전송될 거예요.\n만약 특정 서버에서 알림을 받고싶지 않으시다면 해당 서버에서 `/생일 서버설정` 명령어를 사용해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: "10초만 투자해 봇에 하트를 눌러 추천해주세요!" },
                                        },
                                    ],
                                    components: [new MessageActionRow().addComponents(new MessageButton().setLabel("추천하기").setStyle("LINK").setEmoji("❤️").setURL(`https://koreanbots.dev/bots/${client.user?.id}/vote`))],
                                });
                                return;
                            }
                        }
                    });
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
