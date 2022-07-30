import { APIEmbed, ChannelType, Snowflake } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import client from "../bot";
import { getLocaleString as t } from "../utils/localization";
import TodayBirthdays from "../models/today-birthdays";

const status: { [key: string]: { name: string; color: number; emoji: string } } = {
    register: {
        name: "등록",
        color: 0xf5bed1,
        emoji: "<:cakeprogress:985470905314603018>",
    },
    change: {
        name: "변경",
        color: 0xf5bed1,
        emoji: "<:cakeprogress:985470905314603018>",
    },
    remove: {
        name: "삭제",
        color: 0xf56969,
        emoji: "<:cakeprogress00:985470906891632701>",
    },
    unregister: {
        name: "서버 설정 해제",
        color: 0xf56969,
        emoji: "<:cakeprogress00:985470906891632701>",
    },
};

export { status };

/**
 * 채널에 로그를 전송합니다.
 * @param {Snowflake} guildId 로그를 전송할 길드 Id
 * @param {string} type type
 * @param {Snowflake} userId 유저 Id
 */
export async function sendLogMessage(guildId: Snowflake, type: string, userId: Snowflake, data?: { birthday?: Date; prevBirthday?: Date; allowShowAge?: boolean }) {
    const guildSetting = await Settings.findById(guildId);
    if (!guildSetting || !guildSetting.logChannelId) return;

    const logChannel = await client.channels.fetch(guildSetting.logChannelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const member = await logChannel.guild.members.fetch(userId);
    if (!member) return;

    const embed: APIEmbed = {
        author: {
            name: `${member.nickname || member.user.username} (${member.id})`,
            icon_url: member.displayAvatarURL(),
        },
        description: `${status[type].emoji} <@${member.id}> 생일 ${status[type].name}`,
        color: status[type].color,
        fields: [],
        timestamp: String(new Date().toISOString()),
    };
    switch (type) {
        case "register": {
            if (!data || !data.birthday) return;
            embed.fields?.push({
                name: "등록 생일 정보",
                value: `${data.allowShowAge ? `${data.birthday.getFullYear()}년` : ""} ${("0" + (data.birthday.getMonth() + 1)).slice(-2)}월 ${("0" + data.birthday.getDate()).slice(-2)}일`,
            });
            break;
        }
        case "change": {
            if (!data || !data.birthday || !data.prevBirthday) return;
            embed.fields?.push(
                {
                    name: "이전 생일 정보",
                    value: `${data.allowShowAge ? `${data.prevBirthday.getFullYear()}년` : ""} ${("0" + (data.prevBirthday.getMonth() + 1)).slice(-2)}월 ${("0" + data.prevBirthday.getDate()).slice(-2)}일`,
                },
                {
                    name: "변경된 생일 정보",
                    value: `${data.allowShowAge ? `${data.birthday.getFullYear()}년` : ""} ${("0" + (data.birthday.getMonth() + 1)).slice(-2)}월 ${("0" + data.birthday.getDate()).slice(-2)}일`,
                }
            );
            break;
        }
        case "remove": {
            if (!data || !data.prevBirthday) return;
            embed.fields?.push({
                name: "이전 생일 정보",
                value: `${data.allowShowAge ? `${data.prevBirthday.getFullYear()}년` : ""} ${("0" + (data.prevBirthday.getMonth() + 1)).slice(-2)}월 ${("0" + data.prevBirthday.getDate()).slice(-2)}일`,
            });
            break;
        }
        case "unregister": {
            embed.fields?.push({
                name: "\u200B",
                value: "`/생일 서버설정` 명령어로 서버에서 생일을 공유하지 않도록 설정했어요.",
            });
            break;
        }
    }
    await logChannel.send({
        embeds: [embed],
    });
}

/**
 * 채널에 축하 메시지를 전송하고 스레드를 생성합니다.
 * @param {string} userId 유저 Id
 * @returns 성공 여부
 */
export async function sendBirthMessage(userId: string): Promise<{ success: boolean; message?: string }> {
    const birthday = await Birthdays.findById(userId);

    // 유저가 등록한 모든 길드 forEach
    birthday?.guilds.forEach(async (userGuild) => {
        const guildSetting = await Settings.findById(userGuild._id);
        if (!guildSetting) return { success: false, message: "길드 설정을 찾을 수 없음" };

        const guild = await client.guilds.fetch(guildSetting._id);
        const member = await guild.members.fetch(userId);
        const channel = await client.channels.fetch(guildSetting.channelId);
        if (!channel || channel.type != ChannelType.GuildText) return { success: false, message: "채널을 찾을 수 없음" };

        const message = await channel.send({
            content: "@here",
            embeds: [
                {
                    color: 0xf5bed1,
                    title: `<:cakeprogress:985470905314603018> 오늘은 ${member.nickname || member.user.username} 님의 ${userGuild.allowShowAge ? `${getAge(birthday.date).western}번째 ` : ""}생일이에요!`,
                    description: `<@${member.id}>님의 생일을 축하하는 메시지 하나 남겨보는건 어떨까요?`,
                },
            ],
        });

        const thread = await message.startThread({
            name: `${member.nickname || member.user.username}님의 생일`,
            autoArchiveDuration: 1440,
            reason: `${member.nickname || member.user.username}님의 생일`,
        });
        await thread.members.add(member.id);
        await thread.send({ content: await t("ko", "celebration_messages", [`<@${member.id}>`]) });

        if (guildSetting.roleId) await member.roles.add(guildSetting.roleId);

        await new TodayBirthdays({
            userId: member.id,
            guildId: guild.id,
            threadId: thread.id,
            messageId: message.id,
            roleId: guildSetting.roleId,
        }).save();
    });
    return { success: true };
}

/**
 * 날짜의 생일을 반환합니다.
 * @param {date} birthday 생일을 반환할 Date객체
 * @returns {{ korean: number; western: number }}
 */
export function getAge(birthday: Date): { korean: number; western: number } {
    const today = new Date();
    const koreanAge = today.getFullYear() - birthday.getFullYear() + 1;
    let westernAge = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        westernAge--;
    }
    return {
        korean: koreanAge,
        western: westernAge,
    };
}

/**
 * 날짜의 다음 생일을 반환합니다.
 * @param {date} birthday 생일을 반환할 Date객체
 * @returns {{ rawDate: Date, unix: String }}
 */
export function getNextBirthday(birthday: Date): { rawDate: Date; unix: string } {
    let nextBirthday = new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate());
    if (new Date() == nextBirthday) nextBirthday = new Date();
    if (new Date() > nextBirthday) nextBirthday = new Date(new Date().getFullYear() + 1, birthday.getMonth(), birthday.getDate());
    return { rawDate: nextBirthday, unix: Math.floor(nextBirthday.getTime() / 1000).toFixed(0) };
}

/**
 * 날짜의 탄생석을 반환합니다.
 * @param {date} date 탄생석을 반환할 Date객체
 * @returns {{ name: string; color: HexColorString }}
 */
export function getBirthstone(date: Date): { name: string; color: number } {
    const birthstones: {
        name: string;
        color: number;
    }[] = [
        { name: "석류석", color: 0x952929 },
        { name: "자수정", color: 0x9463c6 },
        { name: "아쿠아마린", color: 0x7bf7cd },
        { name: "다이아몬드", color: 0xd2e4ec },
        { name: "에메랄드", color: 0x4dc274 },
        { name: "진주", color: 0xdbd8cb },
        { name: "루비", color: 0xd9105c },
        { name: "페리도트", color: 0xaebe23 },
        { name: "사파이어", color: 0x0f4fb4 },
        { name: "오팔", color: 0xa3bdb6 },
        { name: "토파즈", color: 0xf7c278 },
        { name: "탄자나이트", color: 0x39497b },
    ];
    const monthIndx: number = date.getMonth();
    return birthstones[monthIndx];
}

// 별자리에 관심도 없고 뭐가 뭔지 모르겠어서 그냥 깃허브 gist에 있는거 따왔습니다.
// https://github.com/tindoductran/zodiac/blob/master/getZodiac2.html

/**
 * 날짜의 별자리를 반환합니다. https://github.com/tindoductran/zodiac/blob/master/getZodiac2.html
 * @param {date} date 별자리를 반환할 Date객체
 * @returns {{ name: string; color: HexColorString }}
 */
export function getZodiac(date: Date): { name: string; color: number; emoji: string } {
    let signMonthIndex;
    //bound is zero indexed and returns the day of month where the boundary occurs
    //ie. bound[0] = 20; means January 20th is the boundary for a zodiac sign
    const bound = [20, 19, 20, 20, 20, 21, 22, 22, 21, 22, 21, 21];
    //startMonth is zero indexed and returns the zodiac sign of the start of that month
    //ie. startMonth[0] = "Capricorn"; means start of January is Zodiac Sign "Capricorn"
    const startMonth = ["염소자리", "물병자리", "물고기자리", "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리", "천칭자리", "전갈자리", "궁수자리"];
    const colors: number[] = [0x707070, 0x458cd2, 0x96c790, 0xdb212c, 0x568e4f, 0xe8cb03, 0xb5b5b5, 0xef7006, 0x9d5d28, 0xed6da0, 0x000000, 0x884aad];
    const emojis = ["♑", "♒", "♓", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐"];
    const monthIndex: number = date.getMonth(); //so we can use zero indexed arrays
    if (Number(("0" + date.getDate()).slice(-2)) <= bound[monthIndex]) {
        //it's start of month -- before or equal to bound date
        signMonthIndex = monthIndex;
    } else {
        //it must be later than bound, we use the next month's startMonth
        signMonthIndex = (monthIndex + 1) % 12; //mod 12 to loop around to January index.
    }
    return {
        name: startMonth[signMonthIndex], //return the Zodiac sign of start Of that month.
        color: colors[signMonthIndex],
        emoji: emojis[signMonthIndex],
    };
}
