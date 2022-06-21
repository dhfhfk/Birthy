import { HexColorString } from "discord.js";
import Settings from "../models/guild-settings";
import client from "../bot";
import { getLocaleString as t } from "../utils/localization";
import TodayBirthdays from "../models/today-birthdays";
import mongoose from "mongoose";

/**
 * 채널에 축하 메시지를 전송합니다.
 * @param {string} channelId 생일을 반환할 Date객체
 * @returns {{ success: Boolean }}
 */
export async function sendBirthMessage(birthday: Date, userId: string, guildId: string, channelId: string, roleId: string, allowShowAge: boolean): Promise<{ success: boolean }> {
    const guild = await client.guilds.fetch(guildId);
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isText()) return { success: false };
    const member = await guild.members.fetch(userId);

    const message = await channel.send({
        content: "@here",
        embeds: [
            {
                color: "#f5bed1",
                title: `<:cakeprogress:985470905314603018> 오늘은 ${member.nickname || member.user.username} 님의 ${allowShowAge ? `${getAge(birthday).western}번째 ` : ""}생일이에요!`,
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

    if (roleId) await member.roles.add(roleId);

    await new TodayBirthdays({
        userId: member.id,
        guildId: guildId,
        threadId: thread.id,
        messageId: message.id,
        roleId: roleId,
        createdAt: new Date(),
    }).save();

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
    let westernAge = koreanAge;
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
export function getBirthstone(date: Date): { name: string; color: HexColorString } {
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
export function getZodiac(date: Date): { name: string; color: HexColorString; emoji: string } {
    let signMonthIndex;
    //bound is zero indexed and returns the day of month where the boundary occurs
    //ie. bound[0] = 20; means January 20th is the boundary for a zodiac sign
    const bound = [20, 19, 20, 20, 20, 21, 22, 22, 21, 22, 21, 21];
    //startMonth is zero indexed and returns the zodiac sign of the start of that month
    //ie. startMonth[0] = "Capricorn"; means start of January is Zodiac Sign "Capricorn"
    const startMonth = ["염소자리", "물병자리", "물고기자리", "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리", "천칭자리", "전갈자리", "궁수자리"];
    const colors: HexColorString[] = ["#707070", "#458cd2", "#96c790", "#db212c", "#568e4f", "#e8cb03", "#b5b5b5", "#ef7006", "#9d5d28", "#ed6da0", "#000000", "#884aad"];
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
