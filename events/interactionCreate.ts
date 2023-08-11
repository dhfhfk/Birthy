import { GuildMember, Interaction, InteractionType } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";
import config from "../config";
import { getLocaleString as t } from "../utils/localization";
import Birthdays from "../models/birthdays";
import { getBirthstone, getZodiac, sendLogMessage } from "../utils/function";
import { Colors } from "../models/Constants";
import { getWriteApi } from "../handlers/influx";
import { Point } from "@influxdata/influxdb-client";

client.on("interactionCreate", async (interaction: Interaction) => {
    const writeApi = getWriteApi("main");
    const interactionPoint = new Point("interaction");
    try {
        // 빗금 명령어
        if (!interaction.guild || !interaction.member) return;

        interactionPoint.tag("type", InteractionType[interaction.type]);

        if (interaction.isChatInputCommand()) {
            interactionPoint.tag(
                "name",
                `${interaction.commandName} ${interaction.options.getSubcommandGroup(false) ? interaction.options.getSubcommandGroup(false) : ""} ${interaction.options.getSubcommand(false) ? interaction.options.getSubcommand(false) : ""}`
            );
            if (!interaction.inCachedGuild()) return;
            import(`../commands/${interaction.commandName}`).then(async (command) => {
                if (command.permissions && !interaction.member.permissions.has(command.permissions)) {
                    return await interaction.reply({
                        ephemeral: true,
                        embeds: [
                            {
                                title: await t(interaction.locale, "permission_denied"),
                                description: await t(interaction.locale, "you_need_following_permission"),
                                color: Colors.error,
                                fields: [
                                    {
                                        name: await t(interaction.locale, "required_permission"),
                                        value: await t(interaction.locale, command.permissions[0].toLowerCase()),
                                    },
                                ],
                            },
                        ],
                    });
                }
                if (command.dev) {
                    if (!config.dev_users) return;
                    if (!config.dev_users.includes(interaction.user.id)) {
                        return await interaction.reply({ content: "개발자가 아닙니다. 이 명령어를 사용할 수 없습니다." });
                    }
                }
                command.run(client, interaction, interaction.locale);
            });
        }

        if (interaction.isContextMenuCommand()) {
            interactionPoint.tag("name", interaction.commandName);
            import(`../commands/${interaction.commandName}`).then(async (command) => {
                if (command) command.run(client, interaction, interaction.locale);
            });
        }

        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            interactionPoint.tag(
                "name",
                `${interaction.commandName} ${interaction.options.getSubcommandGroup(false) ? interaction.options.getSubcommandGroup(false) : ""} ${interaction.options.getSubcommand(false) ? interaction.options.getSubcommand(false) : ""}`
            );
            switch (interaction.commandName) {
                case "생일알림":
                case "생일": {
                    switch (interaction.options.getSubcommand()) {
                        case "지정":
                        case "등록":
                        case "나이공개": {
                            const guildSetting = await Settings.findById(interaction.guildId);
                            if (!guildSetting) {
                                await interaction.respond([{ name: "`/생일알림 셋업`을 진행해주세요.", value: "notYetSet" }]);
                                return;
                            }
                            const choices = [
                                {
                                    name: "공개",
                                    value: "true",
                                },
                            ];
                            if (guildSetting.allowHideAge) {
                                choices.push({ name: "비공개", value: "false" });
                            } else choices[0].name = "공개 (서버 설정에 의해 제한됨)";

                            await interaction.respond(choices);
                            break;
                        }
                    }
                }
            }
        }

        if (interaction.type === InteractionType.MessageComponent) {
            interactionPoint.tag("name", interaction.customId);
            if (!interaction.guildId) return;

            const member = interaction.member as GuildMember;
            const guildSetting = await Settings.findById(interaction.guild.id);
            const userData = await Birthdays.findById(interaction.user.id);

            const options = interaction.customId.split("-");
            switch (options[0]) {
                case "delete": {
                    if (!interaction.isButton()) return;
                    if (options[1] == "false") {
                        await interaction.update({ content: "생일 삭제를 취소했어요.", embeds: [], components: [] });
                        return;
                    }
                    try {
                        userData?.roles.forEach(async (role) => {
                            await member.roles.remove(role);
                        });
                    } catch (e) {
                        //
                    }
                    const prevBirthday = userData;
                    if (!prevBirthday) return;

                    await Birthdays.findByIdAndUpdate(interaction.user.id, { $unset: { date: 1, roles: 1, guilds: 1, allowCreateThread: 1, month: 1, day: 1, allowCreateNotifi: 1 } });
                    // await Birthdays.findByIdAndUpdate(interaction.user.id, {
                    //     $unset: { date: 1, roles: 1, guilds: 1, allowCreateThread: 1, month: 1, day: 1, allowCreateNotifi: 1 },
                    // });
                    await Settings.findByIdAndUpdate(interaction.guildId, {
                        $pull: { members: interaction.user.id },
                    });
                    const userGuildData: { _id: string; allowShowAge: boolean } | undefined = prevBirthday.guilds.find((guild) => {
                        return guild._id == interaction.guildId;
                    });
                    await sendLogMessage(interaction.guildId, "remove", interaction.user.id, { prevBirthday: prevBirthday.date, allowShowAge: userGuildData?.allowShowAge });
                    await interaction.update({ content: "생일을 삭제했어요.", embeds: [], components: [] });
                    return;
                }
                case "birthday": {
                    const allowShowAge = JSON.parse(options[2]);
                    if (!guildSetting || !guildSetting.isSetup) {
                        await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: Colors.error,
                                    title: "<:xbold:985419129316065320> 기본 생일 셋업이 되어있지 않아요!",
                                    description: "서버 관리자가 직접 `/생일알림 셋업`명령어를 이용해 셋업을 진행해야 사용할 수 있어요.",
                                    fields: [
                                        {
                                            name: "해결법",
                                            value: member.permissions.has(["Administrator"]) ? "마침 관리자분이셨네요! `/생일알림 셋업`명령어로 기본적인 셋업을 진행해주세요." : "서버 관리자에게 `/생일알림 셋업`명령어 사용을 요청해주세요.",
                                            inline: false,
                                        },
                                    ],
                                    footer: { text: interaction.guild.id },
                                },
                            ],
                        });
                        return;
                    }
                    if (userData && userData.date) {
                        if (userData.guilds.find((guild) => interaction.guildId == guild._id)) {
                            await interaction.reply({
                                ephemeral: true,
                                embeds: [
                                    {
                                        color: Colors.primary,
                                        author: {
                                            name: member.nickname || interaction.user.username,
                                            icon_url: interaction.user.displayAvatarURL(),
                                        },
                                        title: "<:cakeprogress:985470905314603018> 이미 생일이 등록되어있어요!",
                                        description: "만약 생일을 변경하려 하신다면 `/생일 변경` 명령어를 사용해주세요.",
                                        footer: { text: `${interaction.user.id}` },
                                    },
                                ],
                            });
                            return;
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
                                    $addToSet: { _zodiacRoles: { id: zodiac.id, roleId: role.id } },
                                });
                                await member.roles.add(role);
                            } else {
                                await member.roles.add(zodiacRole);
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
                                await member.roles.add(role);
                            } else {
                                await member.roles.add(birthstoneRole);
                            }

                        }
                        await Birthdays.findByIdAndUpdate(interaction.user.id, {
                            _id: interaction.user.id,
                            $addToSet: { roles: { $each: roles }, guilds: { _id: interaction.guildId, allowShowAge: guildSetting.allowHideAge ? allowShowAge : true } },
                        });
                        await Settings.findByIdAndUpdate(interaction.guildId, {
                            $addToSet: { members: interaction.user.id },
                        });
                        await sendLogMessage(interaction.guildId, "register", interaction.user.id, { birthday: userData.date, allowShowAge: guildSetting.allowHideAge ? allowShowAge : true });
                        await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                {
                                    color: Colors.primary,
                                    author: {
                                        name: member.nickname || interaction.user.username,
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
                        return;
                    }
                    const today = new Date();
                    await interaction.showModal({
                        title: "생일 등록",
                        customId: `birthday-${guildSetting.allowHideAge ? allowShowAge : true}-${interaction.user.id}`,
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
                    return;
                }
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            interactionPoint.tag("name", interaction.customId);
            if (!interaction.guildId) return;

            const guildSetting = await Settings.findById(interaction.guild.id);

            if (!guildSetting) return;
            const change = interaction.customId.split("-")[1] === "change";

            let allowShowAge;
            const targetUserId = interaction.customId.split("-")[2];

            if (!change) {
                allowShowAge = JSON.parse(interaction.customId.split("-")[1]);
            }

            const member = await interaction.guild.members.fetch(targetUserId);

            if (member.user.bot) {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.error,
                            author: {
                                name: member.nickname || member.user.username,
                                icon_url: member.displayAvatarURL(),
                            },
                            title: "<:xbold:985419129316065320> 봇의 생일은 지정할 수 없어요",
                            fields: [
                                {
                                    name: "해결법",
                                    value: "올바른 멤버를 선택해주세요!",
                                    inline: false,
                                },
                            ],
                            footer: { text: `${member.user.id}` },
                        },
                    ],
                });
                return;
            }

            const rawDate = interaction.fields.getTextInputValue("birthday");
            const year = Number(rawDate.substring(0, 4));
            if (isNaN(year) || year > new Date().getFullYear()) {
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.error,
                            author: {
                                name: member.nickname || member.user.username,
                                icon_url: member.displayAvatarURL(),
                            },
                            title: "<:xbold:985419129316065320> 날짜가 잘못 입력되었어요",
                            fields: [
                                {
                                    name: "해결법",
                                    value: "YYYYMMDD 형식으로 생일을 바르게 입력해주세요!",
                                    inline: false,
                                },
                            ],
                            footer: { text: `${member.user.id}` },
                        },
                    ],
                });
                return;
            }
            const month = Number(rawDate.substring(4, 6));
            const day = Number(rawDate.substring(6, 8));
            const birthday = new Date(year, month - 1, day + 0);
            birthday.setHours(birthday.getHours() + 9);
            if (change) {
                const prevBirthday = await Birthdays.findById(member.user.id);
                if (!prevBirthday) return;
                const prevBirthdayDate = prevBirthday.date;

                await prevBirthday?.updateOne(
                    {
                        _id: member.user.id,
                        lastModifiedAt: new Date(),
                        $inc: { modifiedCount: 1 },
                        date: birthday,
                        month: ("0" + (birthday.getMonth() + 1)).slice(-2),
                        day: ("0" + birthday.getDate()).slice(-2),
                    },
                    { upsert: true }
                );
                if (guildSetting.subRole && prevBirthday.roles.length > 0) {
                    prevBirthday.roles.forEach(async (roleId) => {
                        await member.roles.remove(roleId);
                    });
                }
                const decModifiedCount = client.agenda.create("dec modifiedCount", { userId: member.user.id });
                decModifiedCount.schedule("1 month after");
                await decModifiedCount.save();
                const userGuildData: { _id: string; allowShowAge: boolean } | undefined = prevBirthday.guilds.find((guild) => {
                    return guild._id == interaction.guildId;
                });
                await sendLogMessage(interaction.guildId, "change", member.user.id, {
                    birthday: birthday,
                    prevBirthday: prevBirthdayDate,
                    allowShowAge: userGuildData?.allowShowAge,
                });
                await interaction.reply({
                    ephemeral: true,
                    embeds: [
                        {
                            color: Colors.primary,
                            author: {
                                name: member.nickname || member.user.username,
                                icon_url: member.user.displayAvatarURL(),
                            },
                            title: "<:cakeprogress:985470905314603018> 생일을 변경했어요!",
                            description: `생일이 ${birthday.getFullYear()}년 ${("0" + (birthday.getMonth() + 1)).slice(-2)}월 ${("0" + birthday.getDate()).slice(-2)}일로 공유될 거예요.`,
                            footer: { text: "10초만 투자해 봇에 하트를 눌러 추천해주세요!" },
                        },
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: "추천하기",
                                    emoji: "❤️",
                                    style: 5,
                                    url: `https://koreanbots.dev/bots/${client.user?.id}/vote`,
                                },
                            ],
                        },
                    ],
                });
                if (birthday > new Date() || new Date().getFullYear() - birthday.getFullYear() > 100) {
                    await interaction.followUp({ ephemeral: true, content: "생일이 이상하긴 하지만 뭔가 사연이 있으신 거겠죠?" });
                    return;
                }
                return;
            }
            const roles = [];
            if (guildSetting.subRole) {
                const zodiac = getZodiac(birthday);
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
                    await member.roles.add(role);
                } else {
                    await member.roles.add(zodiacRole);
                }

                const birthStone = getBirthstone(birthday);
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
                    await member.roles.add(role);
                } else {
                    await member.roles.add(birthstoneRole);
                }

            }
            await Birthdays.findByIdAndUpdate(
                member.user.id,
                {
                    _id: member.user.id,
                    lastModifiedAt: new Date(),
                    modifiedCount: 0,
                    date: birthday,
                    month: ("0" + (birthday.getMonth() + 1)).slice(-2),
                    day: ("0" + birthday.getDate()).slice(-2),
                    $addToSet: { roles: { $each: roles }, guilds: { _id: interaction.guildId, allowShowAge: guildSetting.allowHideAge ? allowShowAge : true } },
                },
                { upsert: true }
            );
            await Settings.findByIdAndUpdate(interaction.guildId, {
                $addToSet: { members: member.user.id },
            });
            await sendLogMessage(interaction.guildId, "register", member.user.id, {
                birthday: birthday,
                allowShowAge: guildSetting.allowHideAge ? allowShowAge : true,
            });
            await interaction.reply({
                ephemeral: true,
                embeds: [
                    {
                        color: Colors.primary,
                        author: {
                            name: member.nickname || member.user.username,
                            icon_url: member.user.displayAvatarURL(),
                        },
                        title: "<:cakeprogress:985470905314603018> 생일을 등록했어요!",
                        description: `이제 생일이 ${(guildSetting.allowHideAge ? allowShowAge : true) && `${birthday.getFullYear()}년`} ${("0" + (birthday.getMonth() + 1)).slice(-2)}월 ${("0" + birthday.getDate()).slice(
                            -2
                        )}일로 공유될 거예요.`,
                        fields: [
                            {
                                name: "Q. 다른 서버에서도 자동으로 생일이 공유되나요?",
                                value: "`/생일 등록` 명령어를 사용하면 그 서버에서도 생일이 공유될 거예요.\n만약 특정 서버에서 공유하고싶지 않으시다면 해당 서버에서 `/생일 서버설정` 명령어를 사용해주세요.",
                                inline: false,
                            },
                        ],
                        footer: { text: "10초만 투자해 봇에 하트를 눌러 추천해주세요!" },
                    },
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "추천하기",
                                emoji: "❤️",
                                style: 5,
                                url: `https://koreanbots.dev/bots/${client.user?.id}/vote`,
                            },
                        ],
                    },
                ],
            });
            if (birthday > new Date() || new Date().getFullYear() - birthday.getFullYear() > 100) {
                await interaction.followUp({ ephemeral: true, content: "생일이 이상하긴 하지만 뭔가 사연이 있으신 거겠죠?" });
                return;
            }
            return;
        }
    } catch {
        console.log;
    } finally {
        interactionPoint.intField("success", 1);
        writeApi.writePoint(interactionPoint);
        try {
            await writeApi.close();
        } catch (e: any) {
            console.error(e);
            if (e.statusCode === 401) {
                console.log("Please setup a InfluxDB.");
            }
            console.log("\nFinished ERROR");
        }
    }
});
