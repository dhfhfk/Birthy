import { Client, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton, Role, TextChannel, HexColorString, RoleManager } from "discord.js";
import Settings from "../models/guild-settings";
import { saveChannel, getZodiac } from "../utils/function";
import { getLocaleString as t } from "../utils/localization";

const zodiacs: {
    name: string;
    color: HexColorString;
    emoji: string;
}[] = [
    { name: "염소자리", color: "#707070", emoji: "♑" },
    { name: "물병자리", color: "#458cd2", emoji: "♒" },
    { name: "물고기자리", color: "#96c790", emoji: "♓" },
    { name: "양자리", color: "#db212c", emoji: "♈" },
    { name: "황소자리", color: "#568e4f", emoji: "♉" },
    { name: "쌍둥이자리", color: "#e8cb03", emoji: "♊" },
    { name: "게자리", color: "#b5b5b5", emoji: "♋" },
    { name: "사자자리", color: "#ef7006", emoji: "♌" },
    { name: "처녀자리", color: "#9d5d28", emoji: "♍" },
    { name: "천칭자리", color: "#ed6da0", emoji: "♎" },
    { name: "전갈자리", color: "#000000", emoji: "♏" },
    { name: "궁수자리", color: "#884aad", emoji: "♐" },
];
const birthstones: {
    name: string;
    color: HexColorString;
}[] = [
    { name: "석류석", color: "#952929" },
    { name: "자수정", color: "#9463c6" },
    { name: "아쿠아마린", color: "#7bf7cd" },
    { name: "다이아몬드", color: "#d2e4ec" },
    { name: "에메랄드", color: "#4dc274" },
    { name: "진주", color: "#dbd8cb" },
    { name: "루비", color: "#d9105c" },
    { name: "페리도트", color: "#aebe23" },
    { name: "사파이어", color: "#0f4fb4" },
    { name: "오팔", color: "#a3bdb6" },
    { name: "토파즈", color: "#f7c278" },
    { name: "탄자나이트", color: "#39497b" },
];

module.exports = {
    name: "생일알림",
    description: "[관리자] 기념일 및 생일 알림 기능",
    nameLocalizations: {
        "en-US": "setup",
    },
    descriptionLocalizations: {
        "en-US": "[Moderator only] Setup for anniversaries",
    },
    options: [
        {
            name: "셋업",
            description: "[관리자] 기념일을 챙기기 위한 기본 셋업",
            type: "SUB_COMMAND",
        },
        {
            name: "채널",
            description: "[관리자]",
            type: "SUB_COMMAND_GROUP",
            options: [
                {
                    name: "확인",
                    description: "[관리자] 생일 알림 채널 설정을 확인해요.",
                    type: "SUB_COMMAND",
                },
                {
                    name: "지정",
                    description: "[관리자] 생일 알림 채널을 지정해요.",
                    type: "SUB_COMMAND",
                    options: [
                        {
                            name: "채널",
                            description: "어느 채널에 생일 알림을 전송해드릴까요?",
                            type: "CHANNEL",
                            channelTypes: ["GUILD_TEXT"],
                            required: true,
                        },
                    ],
                },
                {
                    name: "만들기",
                    description: "[관리자] 생일 알림 채널을 만들어요.",
                    type: "SUB_COMMAND",
                },
            ],
        },
        {
            name: "역할",
            description: "[관리자]",
            type: "SUB_COMMAND_GROUP",
            options: [
                {
                    name: "확인",
                    description: "[관리자] 탄생석, 별자리 역할을 확인해요.",
                    type: "SUB_COMMAND",
                },
                {
                    name: "삭제",
                    description: "[관리자] Birth가 등록했던 탄생석, 별자리 역할을 모두 삭제해요.",
                    type: "SUB_COMMAND",
                },
                {
                    name: "만들기",
                    description: "[관리자] 탄생석, 별자리 역할 24개를 만들어요.",
                    type: "SUB_COMMAND",
                },
            ],
        },
    ],
    permissions: ["ADMINISTRATOR"],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        // 길드의 설정 정복 가져오기
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
                                            color: "#f56969",
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
                                        color: "#f5bed1",
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
                            await saveChannel(interaction.guild.id, channel.id);
                            return await interaction.editReply({
                                embeds: [
                                    {
                                        color: "#f5bed1",
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
                            const channel = await interaction.guild.channels.create("🎂", {
                                type: "GUILD_TEXT",
                            });
                            await saveChannel(interaction.guild.id, channel.id);
                            return;
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
                            if (!settingData || settingData.zodiacRoles.length <= 0) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: "#f56969",
                                            title: "<:xbold:985419129316065320> 역할을 찾을 수 없어요!",
                                            description: "아직 셋업을 진행하지 않았거나 역할 등록을 취소하셨나봐요.",
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
                            const zodiacErr: number[] = [];
                            const birthstoneErr: number[] = [];
                            settingData.zodiacRoles.forEach(async (r, i) => {
                                if (!interaction.guild.roles.cache?.find((role) => role.id == r)) zodiacErr.push(i);
                            });
                            settingData.birthstoneRoles.forEach(async (r, i) => {
                                if (!interaction.guild.roles.cache?.find((role) => role.id == r)) birthstoneErr.push(i);
                            });
                            return await interaction.editReply({
                                embeds: [
                                    {
                                        color: "#f5bed1",
                                        title: "<:cakeprogress:985470905314603018> 제가 등록했던 역할 정보예요.",
                                        fields: [
                                            {
                                                name: `별자리 역할 무결성 (${String(12 - zodiacErr.length)}/12)`,
                                                value: zodiacErr.length > 0 ? "몇몇 역할이 존재하지 않는 것 같아요! `/역할 만들기`명령어로 역함을 다시 추가해주세요." : "모두 존재해요.",
                                                inline: false,
                                            },
                                            {
                                                name: `탄생석 역할 무결성 (${String(12 - birthstoneErr.length)}/12)`,
                                                value: birthstoneErr.length > 0 ? "몇몇 역할이 존재하지 않는 것 같아요! `/역할 만들기`명령어로 역함을 다시 추가해주세요." : "모두 존재해요.",
                                                inline: false,
                                            },
                                            {
                                                name: "역할 통계",
                                                value: "아직 지원하지 않아요.",
                                                inline: false,
                                            },
                                        ],
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                            });
                        }
                        case "삭제": {
                            // 만약 역할 정보가 없다면
                            if (!settingData || settingData.zodiacRoles.length <= 0) {
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: "#f56969",
                                            title: "<:xbold:985419129316065320> 역할을 찾을 수 없어요!",
                                            description: "아직 셋업을 진행하지 않았거나 역할 등록을 취소하셨나봐요.",
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
                            if (settingData && settingData.zodiacRoles.length > 0) {
                                settingData.zodiacRoles.forEach(async (r) => {
                                    await interaction.guild.roles.delete(r, `${interaction.user.username} 유저 요청으로 삭제`);
                                });
                                settingData.birthstoneRoles.forEach(async (r) => {
                                    await interaction.guild.roles.delete(r, `${interaction.user.username} 유저 요청으로 삭제`);
                                });
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        roleNameType: "",
                                        zodiacRoles: [],
                                        birthstoneRoles: [],
                                    },
                                    { upsert: true }
                                );
                                return await interaction.editReply({
                                    embeds: [
                                        {
                                            color: "#f5bed1",
                                            title: "<:cakeprogress:985470905314603018> 모든 역할을 삭제했어요.",
                                            description: "이제 탄생석, 별자리 역할 기능을 사용하지 않을 거에요.",
                                            footer: { text: interaction.guild.id },
                                        },
                                    ],
                                });
                            }
                        }
                    }
                    return;
                }
            }
        }

        switch (interaction.options.getSubcommand()) {
            case "셋업": {
                let createChannel = false;
                let createRole = false;
                let allowCreateThread = false;
                let channel: TextChannel;
                let role: Role;
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: "#f5bed1",
                            title: "<:cakeprogress01:985470908737134692> 모든 생일 알림을 전송할 채팅 채널을 새롭게 만들까요?",
                            description: "새로운 채널 만들기를 원하지 않는다면 셋업 후 `/생일알림 채널 지정` 명령어를 이용해 이미 있는 채널을 지정해주세요.",
                            fields: [
                                {
                                    name: "아니요",
                                    value: "이미 있는 채널에 생일 알림을 전송할게요. (`/생일알림 채널 지정`명령어 필요)",
                                    inline: false,
                                },
                                {
                                    name: "네",
                                    value: "채팅 채널을 만들고 그 채널에 생일 알림을 전송할게요.",
                                },
                            ],
                            footer: { text: `1/3 진행 중, ${interaction.guildId}` },
                        },
                    ],
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setCustomId(`${interaction.id}-channel-existing`).setLabel("아니요").setStyle("SECONDARY"),
                            new MessageButton().setCustomId(`${interaction.id}-channel-create`).setLabel("네").setStyle("PRIMARY")
                        ),
                    ],
                });
                const filter = (i: MessageComponentInteraction) => i.customId.startsWith(interaction.id);

                const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 300000 });
                collector?.on("collect", async (i: MessageComponentInteraction) => {
                    const options = i.customId.split("-");
                    switch (options[1]) {
                        case "channel": {
                            if (options[2] == "create") {
                                createChannel = true;
                            }
                            await i.deferUpdate();
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: "#f5bed1",
                                        title: "<:cakeprogress02:985470913938071642> 서버의 멤버들이 생일 축하메시지를 전송하기 위한 개별 채팅 채널(쓰레드)를 만들어드릴까요?",
                                        description: "자세한 정보는 아래 이미지를 참조해주세요.",
                                        fields: [
                                            {
                                                name: "아니요",
                                                value: "개별 채팅 채널을 만들지 않고 그냥 알림만 전송해요.",
                                                inline: false,
                                            },
                                            {
                                                name: "네",
                                                value: "생일인 멤버에게 메시지를 전송할 수 있는 개별 채팅 채널을 만들어요. (다음 날이 되면 자동으로 보관처리될거에요)",
                                            },
                                        ],
                                        footer: { text: `2/3 진행 중, ${interaction.guildId}` },
                                    },
                                ],
                                components: [
                                    new MessageActionRow().addComponents(
                                        new MessageButton().setCustomId(`${interaction.id}-thread-false`).setLabel("아니요").setStyle("SECONDARY"),
                                        new MessageButton().setCustomId(`${interaction.id}-thread-true`).setLabel("네").setStyle("PRIMARY")
                                    ),
                                ],
                            });
                            return;
                        }
                        case "thread": {
                            allowCreateThread = JSON.parse(options[2]);
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    allowCreateThread: allowCreateThread,
                                },
                                { upsert: true }
                            );
                            await i.deferUpdate();
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: "#f5bed1",
                                        title: "<:cakeprogress03:985470915540291624> 멤버 목록에서 생일인 멤버를 따로 확인할 수 있는 역할을 만들어드릴까요?",
                                        description: "자세한 정보는 아래 이미지를 참조해주세요.",
                                        fields: [
                                            {
                                                name: "아니요",
                                                value: "생일 역할 기능을 사용하지 않아요.",
                                                inline: false,
                                            },
                                            {
                                                name: "네",
                                                value: "역할을 만들고 생일인 멤버에게 역할을 지정해요.",
                                            },
                                        ],
                                        footer: { text: `3/3 진행 중, ${interaction.guildId}` },
                                    },
                                ],
                                components: [
                                    new MessageActionRow().addComponents(
                                        new MessageButton().setCustomId(`${interaction.id}-role-false`).setLabel("아니요").setStyle("SECONDARY"),
                                        new MessageButton().setCustomId(`${interaction.id}-role-true`).setLabel("네").setStyle("PRIMARY")
                                    ),
                                ],
                            });
                            return;
                        }
                        case "role": {
                            if (options[2] == "true") {
                                createRole = true;
                            }
                            //? 생일 역할 이름 커스텀 모달인데 순서 이슈로 비활성화
                            // await i.showModal({
                            //     title: "생일 역할 커스텀",
                            //     customId: `${interaction.id}-role-true`,
                            //     components: [
                            //         {
                            //             type: 1,
                            //             components: [
                            //                 {
                            //                     type: 4,
                            //                     customId: "role-name",
                            //                     label: "생일 역할 이름을 지정해주세요. (서버 설정에서 언제나 바꿀 수 있어요)",
                            //                     style: 1,
                            //                     min_length: 1,
                            //                     max_length: 100,
                            //                     placeholder: "🎂오늘 생일인 멤버들!",
                            //                     required: true,
                            //                 },
                            //             ],
                            //         },
                            //     ],
                            // });

                            //? 별자리, 탄생석 역할 기능인데 rateLimit 이슈로 비활성화
                            // await i.deferUpdate();
                            // const todayZodiac = getZodiac(new Date());
                            // await interaction.editReply({
                            //     embeds: [
                            //         {
                            //             color: "#f5bed1",
                            //             title: "<:cakeprogress03:985470915540291624> 탄생석과 별자리를 역할로 만들고 멤버에게 지정해드릴까요?",
                            //             description: "자세한 정보는 아래 설명을 참조해주세요.",
                            //             fields: [
                            //                 {
                            //                     name: "아니요",
                            //                     value: "탄생석 및 별자리 기능을 사용하지 않아요.",
                            //                     inline: false,
                            //                 },
                            //                 {
                            //                     name: "만들기 - 이모지만",
                            //                     value: `\`${todayZodiac.emoji}\` 형식`,
                            //                 },
                            //                 {
                            //                     name: "만들기 - 이름만",
                            //                     value: `\`${todayZodiac.name}\` 형식`,
                            //                 },
                            //                 {
                            //                     name: "만들기 - 이모지+이름",
                            //                     value: `\`${todayZodiac.emoji} ${todayZodiac.name}\` 형식`,
                            //                 },
                            //                 {
                            //                     name: "**정보**",
                            //                     value: "탄생석 역할은 이모지를 지원하지 않아요.",
                            //                 },
                            //             ],
                            //             footer: { text: `4/4 진행 중, ${interaction.guildId}` },
                            //         },
                            //     ],
                            //     components: [
                            //         new MessageActionRow().addComponents(
                            //             new MessageButton().setCustomId(`${interaction.id}-subrole-false`).setLabel("아니요").setStyle("SECONDARY"),
                            //             new MessageButton().setCustomId(`${interaction.id}-subrole-true-emoji`).setLabel("만들기 - 이모지만").setStyle("PRIMARY"),
                            //             new MessageButton().setCustomId(`${interaction.id}-subrole-true-name`).setLabel("만들기 - 이름만").setStyle("PRIMARY"),
                            //             new MessageButton().setCustomId(`${interaction.id}-subrole-true-both`).setLabel("만들기 - 이모지+이름").setStyle("PRIMARY")
                            //         ),
                            //     ],
                            // });
                            if (createChannel) {
                                channel = await interaction.guild.channels.create("🎂", {
                                    type: "GUILD_TEXT",
                                });
                                await saveChannel(interaction.guild.id, channel.id);
                            } else {
                                await saveChannel(interaction.guild.id, "");
                            }
                            if (createRole) {
                                try {
                                    role = await interaction.guild.roles.create({
                                        name: "🎂오늘 생일",
                                        position: interaction.guild.roles.highest.position - 1,
                                        color: "#f5bed1",
                                        hoist: true,
                                    });
                                } catch {
                                    if (!role)
                                        role = await interaction.guild.roles.create({
                                            name: "🎂오늘 생일",
                                            color: "#f5bed1",
                                            hoist: true,
                                        });
                                }
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        roleId: role.id,
                                    },
                                    { upsert: true }
                                );
                            } else {
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        roleId: "",
                                    },
                                    { upsert: true }
                                );
                            }
                            await Settings.findByIdAndUpdate(
                                interaction.guildId,
                                {
                                    _id: interaction.guildId,
                                    isSetup: true,
                                },
                                { upsert: true }
                            );
                            await interaction.editReply({
                                embeds: [
                                    {
                                        color: "#f5bed1",
                                        title: "<:cakeprogress:985470905314603018> 생일 알림 셋업을 완료했어요!",
                                        description: "이제 멤버들이 자신의 생일을 등록할 수 있도록 알려주세요.",
                                        fields: [
                                            {
                                                name: "생일 알림 채널",
                                                value: channel ? `<#${channel.id}>` : "**`/생일알림 채널 지정` 명령어로 채널을 지정해주세요!**",
                                                inline: false,
                                            },
                                            {
                                                name: "쓰레드 만들기",
                                                value: allowCreateThread ? "예" : "아니오",
                                                inline: false,
                                            },
                                            {
                                                name: "생일 역할",
                                                value: role ? `<@&${role.id}>` : "사용하지 않음",
                                                inline: false,
                                            },
                                        ],
                                        footer: { text: interaction.guild.id },
                                    },
                                ],
                                components: [],
                            });
                            if (role) await interaction.followUp({ ephemeral: true, content: `팁: \`서버 설정\` -> \`역할\`메뉴에서 <@&${role.id}>역할을 가장 위로 끌어올리면 생일인 멤버들을 목록 위에서 확인할 수 있어요.` });
                            if (!channel) await interaction.followUp({ ephemeral: true, content: "꼭 **`/생일알림 채널 지정` 명령어로 채널을 지정해주세요!**" });
                            return;
                        }
                        //? 별자리, 탄생석 역할 기능인데 rateLimit 이슈로 비활성화
                        case "subrole": {
                            let zodiacRoles;
                            if (settingData && settingData.zodiacRoles.length > 0) {
                                settingData.zodiacRoles.forEach(async (r) => {
                                    await interaction.guild.roles.delete(r, "별자리 역할 무결성을 위해 삭제");
                                });
                                settingData.birthstoneRoles.forEach(async (r) => {
                                    await interaction.guild.roles.delete(r, "탄생석 역할 무결성을 위해 삭제");
                                });
                            }
                            if (options[2] == "true") {
                                await interaction.editReply({ components: [] });
                                await i.reply({ ephemeral: true, content: "시간이 좀 걸려요. 역할을 열심히 만들고있으니 잠시 기다려주세요!" });
                                const birthstoneRoles = await Promise.all(
                                    birthstones.map(async (b) => {
                                        return await interaction.guild.roles.create({
                                            name: `${b.name}`,
                                            color: b.color,
                                            hoist: false,
                                        });
                                    })
                                );

                                switch (options[3]) {
                                    // 이모지만
                                    case "emoji": {
                                        zodiacRoles = await Promise.all(
                                            zodiacs.map(async (z) => {
                                                return await interaction.guild.roles.create({
                                                    name: `${z.emoji}`,
                                                    color: z.color,
                                                    hoist: false,
                                                });
                                            })
                                        );
                                        break;
                                    }

                                    // 이름만
                                    case "name": {
                                        zodiacRoles = await Promise.all(
                                            zodiacs.map(async (z) => {
                                                return await interaction.guild.roles.create({
                                                    name: `${z.name}`,
                                                    color: z.color,
                                                    hoist: false,
                                                });
                                            })
                                        );
                                        break;
                                    }

                                    // 이모지 + 이름
                                    case "both": {
                                        zodiacRoles = await Promise.all(
                                            zodiacs.map(async (z) => {
                                                return await interaction.guild.roles.create({
                                                    name: `${z.emoji} ${z.name}`,
                                                    color: z.color,
                                                    hoist: false,
                                                });
                                            })
                                        );
                                        break;
                                    }
                                }
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        roleNameType: options[3],
                                        zodiacRoles: zodiacRoles,
                                        birthstoneRoles: birthstoneRoles,
                                    },
                                    { upsert: true }
                                );
                                await i.editReply({ content: "24개의 역할을 등록했어요. 만약 역할을 모두 삭제하고싶다면 `/생일알림 역할 삭제` 명령어를 사용해주세요." });
                            } else {
                                await Settings.findByIdAndUpdate(
                                    interaction.guildId,
                                    {
                                        _id: interaction.guildId,
                                        roleNameType: "",
                                        zodiacRoles: [],
                                        birthstoneRoles: [],
                                    },
                                    { upsert: true }
                                );
                            }
                        }
                    }
                });
            }
        }

        // client.on("interactionCreate", async (i: Interaction) => {
        //     if (!i.isModalSubmit()) return;
        //     if (!i.customId.startsWith(interaction.id)) return;
        //     const options = i.customId.split("-");
        //     switch (options[1]) {
        //         case "channel": {
        //             return;
        //         }
        //         case "role": {
        //             await i.deferUpdate();
        //             return;
        //         }
        //     }
        // });

        // const message = await channel.send({ content: "@here 오늘은 테스트님의 생일이에요! 생일을 축하하는 메시지 하나 남겨보는건 어떨까요?" });
        // const thread = await message.startThread({
        //     name: "테스트님의 생일",
        //     autoArchiveDuration: 1440,
        //     reason: "테스트님의 생일",
        // });
        // await thread.members.add("868814766225887232");
        // await thread.send({ content: "테스트님 생일 축하드려요!🎉 즐겁고 행복한 하루 보내시길 바라요!" });

        // console.log(`Created thread: ${thread.name}`);
    },
};
