import { Client, CommandInteraction, MessageComponentInteraction, Role, ChannelType, ApplicationCommandOptionType } from "discord.js";
import Settings from "../models/guild-settings";
import { getAge } from "../utils/function";

module.exports = {
    name: "생일알림",
    description: "[관리자] 기념일 및 생일 알림 기능",
    nameLocalizations: {
        "en-US": "setup",
    },
    descriptionLocalizations: {
        "en-US": "[Moderator only] Setup for anniversaries",
    },
    defaultPermission: false,
    dmPermission: false,
    options: [
        {
            name: "셋업",
            description: "[관리자] 기념일을 챙기기 위한 기본 셋업",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "채널",
                    description: "어느 채널에 생일 알림을 전송해드릴까요? (선택하지 않으면 새로 만들어드릴게요)",
                    type: ApplicationCommandOptionType.Channel,
                    channelTypes: [ChannelType.GuildText],
                    required: false,
                },
            ],
        },
        // {
        //     name: "공지전송",
        //     description: "[관리자] 멤버들이 생일을 등록할 수 있도록 공지 메시지를 전송해요.",
        //     type: ApplicationCommandOptionType.Subcommand,
        // },
        {
            name: "채널",
            description: "[관리자]",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "확인",
                    description: "[관리자] 생일 알림 채널 설정을 확인해요.",
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: "지정",
                    description: "[관리자] 생일 알림 채널을 지정해요.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "채널",
                            description: "어느 채널에 생일 알림을 전송해드릴까요?",
                            type: ApplicationCommandOptionType.Channel,
                            channelTypes: [ChannelType.GuildText],
                            required: true,
                        },
                    ],
                },
                {
                    name: "만들기",
                    description: "[관리자] 생일 알림 채널을 만들어요.",
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: "역할",
            description: "[관리자]",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                // {
                //     name: "확인",
                //     description: "[관리자] 탄생석, 별자리 역할을 확인해요.",
                //     type: ApplicationCommandOptionType.Subcommand,
                // },
                {
                    name: "비활성화",
                    description: "[관리자] Birth가 등록했던 탄생석, 별자리 역할을 모두 삭제하고 비활성화해요.",
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: "활성화",
                    description: "[관리자] 탄생석, 별자리 역할기능을 활성화해요.",
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: "테스트",
            description: "[관리자] 테스트용 생일 알림을 보내요.",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    permissions: ["Administrator"],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        if (!interaction.guild) return;
        if (!interaction.isChatInputCommand()) return;

        // 길드의 설정 정보 가져오기
        const settingData = await Settings.findById(interaction.guild.id);

        // SUB_COMMAND_GROUP 가져오기
        if (interaction.options.getSubcommandGroup(false)) {
            switch (interaction.options.getSubcommandGroup()) {
                case "채널": {
                    switch (interaction.options.getSubcommand()) {
                        // 채널 확인
                        case "확인": {
                            await interaction.deferReply({ ephemeral: true });
                            // 만약 채널 정보가 없다면
                            if (!settingData || !settingData.channelId || !client.channels.cache.get(settingData.channelId)) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 지정된 생일 알림 채널이 없어요!",
                                            description: "이러면 생일 알림 기능이 제대로 작동하지 않을 거예요! 같이 해결해봐요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            return await interaction.editReply({
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress:985470905314603018> 생일 알림 채널 정보예요.",
                                        fields: [
                                            {
                                                name: "알림 채널",
                                                value: `<#${settingData.channelId}>`,
                                                inline: false,
                                            },
                                        ],
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                            });
                        }
                        // 채널 지정
                        case "지정": {
                            const channel = interaction.options.getChannel("채널", true);
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    channelId: channel.id,
                                },
                                { upsert: true }
                            );
                            return await interaction.reply({
                                ephemeral: true,
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress:985470905314603018> 생일 알림 채널을 지정했어요.",
                                        description: "이제 멤버들이 자신의 생일을 등록할 수 있도록 알려주세요.",
                                        fields: [
                                            {
                                                name: "생일 알림 채널",
                                                value: `<#${channel.id}>`,
                                                inline: false,
                                            },
                                        ],
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                                components: [],
                            });
                        }
                        // 채널 만들기
                        case "만들기": {
                            try {
                                const channel = await interaction.guild.channels.create({
                                    name: "🎂",
                                    type: ChannelType.GuildText,
                                });
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        channelId: channel.id,
                                    },
                                    { upsert: true }
                                );
                                return;
                            } catch (e) {
                                return await interaction.reply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 채널을 만들던 중 오류가 발생했어요.",
                                            description: String(e),
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                        }
                    }
                    return;
                }
                case "역할": {
                    await interaction.deferReply({ ephemeral: true });
                    switch (interaction.options.getSubcommand()) {
                        // 역할 확인
                        case "확인": {
                            // 만약 역할 정보가 없다면
                            if (!settingData) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 아직 셋업을 진행하지 않으셨어요!",
                                            description: "같이 해결해봐요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            // 리팩토링 예정
                            // if (!settingData.subRole) {
                            //     return await interaction.editReply({
                            //         embeds: [
                            //             {
                            //                 color: 0xf56969,
                            //                 title: "<:xbold:985419129316065320> 이미 별자리, 탄생석 기능이 비활성화되어있어요!",
                            //                 description: "혹시 활성화시키고 싶으시다면 제가 도와드릴게요.",
                            //                 fields: [
                            //                     {
                            //                         name: "해결법",
                            //                         value: "`/생일알림 역할 활성화`명령어로 활성화시킬 수 있어요.",
                            //                         inline: false,
                            //                     },
                            //                 ],
                            //                 footer: { text: interaction.guild.id },
                            //             },
                            //         ],
                            //     });
                            // }
                            // const zodiacErr: number[] = [];
                            // const birthstoneErr: number[] = [];
                            // if (!interaction.guild) return;
                            // settingData.zodiacRoles.forEach(async (r, i) => {
                            //     if (!interaction.guild.roles.cache?.find((role) => role.id == r._id)) zodiacErr.push(i);
                            // });
                            // settingData.birthstoneRoles.forEach(async (r, i) => {
                            //     if (!interaction.guild.roles.cache?.find((role) => role.id == r._id)) birthstoneErr.push(i);
                            // });
                            // return await interaction.editReply({
                            //     embeds: [
                            //         {
                            //             color: 0xf5bed1,
                            //             title: "<:cakeprogress:985470905314603018> 제가 등록했던 역할 정보예요.",
                            //             fields: [
                            //                 {
                            //                     name: "별자리 역할 무결성",
                            //                     value: `${String(12 - zodiacErr.length)}/12`,
                            //                     inline: false,
                            //                 },
                            //                 {
                            //                     name: "탄생석 역할 무결성",
                            //                     value: `${String(12 - birthstoneErr.length)}/12)`,
                            //                     inline: false,
                            //                 },
                            //                 {
                            //                     name: "역할 통계",
                            //                     value: "아직 지원하지 않아요.",
                            //                     inline: false,
                            //                 },
                            //             ],
                            //             footer: { text: interaction.guild.id },
                            //         },
                            //     ],
                            // });
                            return;
                        }
                        case "비활성화": {
                            // 만약 역할 정보가 없다면
                            if (!settingData) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 아직 셋업을 진행하지 않으셨어요!",
                                            description: "같이 해결해봐요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            if (!settingData.subRole) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 이미 별자리, 탄생석 기능이 비활성화되어있어요!",
                                            description: "혹시 활성화시키고 싶으시다면 제가 도와드릴게요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 역할 활성화`명령어로 활성화시킬 수 있어요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            if (settingData) {
                                // 리팩토링 예정
                                // try {
                                //     settingData.zodiacRoles.forEach(async (r) => {
                                //         await interaction.guild.roles.delete(r._id, `${interaction.user.username} 유저 요청으로 삭제`);
                                //     });
                                //     settingData.birthstoneRoles.forEach(async (r) => {
                                //         await interaction.guild.roles.delete(r._id, `${interaction.user.username} 유저 요청으로 삭제`);
                                //     });
                                // } catch (e) {
                                //     //
                                // }
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        subRole: false,
                                        zodiacRoles: [],
                                        birthstoneRoles: [],
                                    },
                                    { upsert: true }
                                );
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf5bed1,
                                            title: "<:cakeprogress:985470905314603018> 모든 역할을 삭제했어요.",
                                            description: "이제 탄생석, 별자리 역할 기능을 사용하지 않을 거예요.",
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            return;
                        }
                        case "활성화": {
                            //
                            if (!settingData) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 아직 셋업을 진행하지 않으셨어요!",
                                            description: "같이 해결해봐요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            if (settingData.subRole) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: 0xf56969,
                                            title: "<:xbold:985419129316065320> 이미 별자리, 탄생석 기능이 활성화되어있어요!",
                                            description: "혹시 비활성화시키고 싶으시다면 제가 도와드릴게요.",
                                            fields: [
                                                {
                                                    name: "해결법",
                                                    value: "`/생일알림 역할 비활성화`명령어로 비활성화시킬 수 있어요.",
                                                    inline: false,
                                                },
                                            ],
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    subRole: true,
                                },
                                { upsert: true }
                            );
                            return await interaction.editReply({
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress:985470905314603018> 별자리, 탄생석 기능을 활성화했어요.",
                                        description: "멤버의 선택에 따라 역할을 부여할게요.",
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                            });
                        }
                    }
                    return;
                }
            }
        }

        switch (interaction.options.getSubcommand()) {
            case "테스트": {
                await interaction.deferReply({ ephemeral: true });
                // 만약 채널 정보가 없다면
                if (!settingData || !settingData.channelId || !client.channels.cache.get(settingData.channelId)) {
                    return await interaction.editReply({
                        embeds: [
                            {
                                color: 0xf56969,
                                title: "<:xbold:985419129316065320> 지정된 생일 알림 채널이 없어요!",
                                description: "이러면 생일 알림 기능이 제대로 작동하지 않을 거예요! 같이 해결해봐요.",
                                fields: [
                                    {
                                        name: "해결법",
                                        value: "`/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요.",
                                        inline: false,
                                    },
                                ],
                                footer: { text: interaction.guild.id },
                            },
                        ],
                    });
                }
                const channel = client.channels.cache.get(settingData.channelId);
                if (!channel || channel.type != ChannelType.GuildText) return;
                try {
                    const message = await channel.send({
                        content: "`@here`",
                        embeds: [
                            {
                                color: 0xf5bed1,
                                title: `<:cakeprogress:985470905314603018> 오늘은 ${client.user?.username}님의 ${getAge(new Date("2022-04-30")).western}번째 생일이에요!`,
                                description: `<@${client.user?.id}>님의 생일을 축하하는 메시지 하나 남겨보는건 어떨까요?`,
                                fields: [
                                    {
                                        name: "\u200B",
                                        value: "🤖 테스트 메시지입니다.",
                                        inline: false,
                                    },
                                ],
                            },
                        ],
                    });
                    const thread = await message.startThread({
                        name: `${client.user?.username}님의 생일`,
                        autoArchiveDuration: 1440,
                        reason: `${client.user?.username}님의 생일`,
                    });
                    await thread.members.add(client.user!.id);
                    await thread.send({ content: `${client.user?.username}님 생일 축하드려요!🎉 즐겁고 행복한 테스트가 되길 바랄게요!` });

                    return await interaction.editReply({ content: `<#${thread.id}> 테스트용 스레드를 생성했어요. 삭제는 알아서 해주세요!` });
                } catch (e) {
                    return await interaction.editReply({ content: `오류가 발생했어요. ${e}` });
                }
            }

            case "셋업": {
                let createRole = false;
                let createChannel = false;
                let createSubRole = false;
                let channel = interaction.options.getChannel("채널", false);
                let role: Role;

                if (!channel) {
                    createChannel = true;
                }

                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: 0xf5bed1,
                            title: "<:cakeprogress00:985470906891632701> 서버의 멤버들이 나이를 숨길 수 있도록 할까요?",
                            description: "허용하면 멤버가 생일을 등록할 때 공개 여부를 선택할 수 있어요.",
                            footer: { text: `${interaction.guildId} 1/3 나이 숨기기` },
                        },
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: "아니오",
                                    style: 2,
                                    customId: `${interaction.id}-hideAge-false`,
                                },
                                {
                                    type: 2,
                                    label: "허용",
                                    emoji: "<:cakeprogress:985470905314603018>",
                                    style: 1,
                                    customId: `${interaction.id}-hideAge-true`,
                                },
                            ],
                        },
                    ],
                });

                const filter = (i: MessageComponentInteraction) => i.customId.startsWith(interaction.id);

                const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 300000 });
                collector?.on("collect", async (i: MessageComponentInteraction) => {
                    const options = i.customId.split("-");
                    if (!options[0].startsWith(interaction.id)) return;
                    switch (options[1]) {
                        case "hideAge": {
                            await i.deferUpdate();
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    allowHideAge: JSON.parse(options[2]),
                                },
                                { upsert: true }
                            );
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress02:985470913938071642> 별자리, 탄생석 역할을 만들어드릴까요?",
                                        description: "자세한 정보는 아래 이미지를 참조해주세요.",
                                        image: {
                                            url: "https://i.ibb.co/y8Qt021/subRoles.png",
                                        },
                                        footer: { text: `${interaction.guildId} 2/3 서브 역할 만들기` },
                                    },
                                ],
                                components: [
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                label: "아니오",
                                                style: 2,
                                                customId: `${interaction.id}-subRole-false`,
                                            },
                                            {
                                                type: 2,
                                                label: "만들기",
                                                emoji: "<:cakeprogress:985470905314603018>",
                                                style: 1,
                                                customId: `${interaction.id}-subRole-true`,
                                            },
                                        ],
                                    },
                                ],
                            });
                            break;
                        }
                        case "subRole": {
                            await i.deferUpdate();
                            createSubRole = JSON.parse(options[2]);
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress03:985470915540291624> 멤버 목록에서 생일인 멤버를 따로 확인할 수 있는 역할을 만들어드릴까요?",
                                        description: "자세한 정보는 아래 이미지를 참조해주세요.",
                                        image: {
                                            url: "https://i.ibb.co/98kf4s3/Birthday-Role-01.png",
                                        },
                                        footer: { text: `${interaction.guildId} 3/3 생일 역할 만들기` },
                                    },
                                ],
                                components: [
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                label: "아니요",
                                                style: 2,
                                                customId: `${interaction.id}-role-false`,
                                            },
                                            {
                                                type: 2,
                                                label: "만들기",
                                                emoji: "<:cakeprogress:985470905314603018>",
                                                style: 1,
                                                customId: `${interaction.id}-role-true`,
                                            },
                                        ],
                                    },
                                ],
                            });
                            break;
                        }
                        case "role": {
                            await i.deferUpdate();
                            createRole = JSON.parse(options[2]);
                            if (!interaction.guild) return;
                            if (createChannel) {
                                try {
                                    channel = await interaction.guild.channels.create({
                                        name: "🎂",
                                        type: ChannelType.GuildText,
                                    });
                                } catch (e) {
                                    await interaction.editReply({
                                        embeds: [
                                            {
                                                color: 0xf56969,
                                                title: "<:xbold:985419129316065320> 채널을 생성하던 중 오류가 발생했어요",
                                                description: String(e),
                                                footer: { text: interaction.guild.id },
                                            },
                                        ],
                                        components: [],
                                    });
                                    return;
                                }
                            }
                            // 생일 역할 만들기
                            if (createRole) {
                                if (settingData?.roleId) {
                                    try {
                                        await interaction.guild.roles.delete(settingData.roleId, "무결성을 위해 삭제");
                                    } catch (e) {
                                        //
                                    }
                                }

                                try {
                                    // 가능하다면 가장 높은 위치로
                                    role = await interaction.guild.roles.create({
                                        name: "🎂오늘 생일",
                                        position: interaction.guild.roles.highest.position - 1,
                                        permissions: [],
                                        color: 0xf5bed1,
                                        hoist: true,
                                    });
                                } catch {
                                    //
                                }
                            }
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    isSetup: true,
                                    subRole: createSubRole,
                                    channelId: channel?.id,
                                    roleId: role ? role.id : "",
                                },
                                { upsert: true }
                            );
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: 0xf5bed1,
                                        title: "<:cakeprogress:985470905314603018> 생일 알림 셋업을 완료했어요!",
                                        description: "이제 멤버들이 자신의 생일을 등록할 수 있도록 알려주세요.",
                                        fields: [
                                            {
                                                name: "생일 알림 채널",
                                                value: channel ? `<#${channel.id}>` : "**`/생일알림 채널 지정` 명령어로 채널을 지정해주세요!**",
                                                inline: false,
                                            },
                                            {
                                                name: "생일 역할",
                                                value: role ? `<@&${role.id}>` : "사용하지 않음",
                                                inline: false,
                                            },
                                            // {
                                            //     name: "\u200B",
                                            //     value: "`/생일알림 공지전송` 명령어를 통해 등록 가이드를 전송할 수 있어요.",
                                            //     inline: false,
                                            // },
                                        ],
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                                components: [],
                            });
                            if (role) await interaction.followUp({ ephemeral: true, content: `팁: \`서버 설정\` -> \`역할\`메뉴에서 <@&${role.id}>역할을 가장 위로 끌어올리면 생일인 멤버들을 목록 위에서 확인할 수 있어요.` });
                            return;
                        }
                    }
                });
            }
        }
    },
};
