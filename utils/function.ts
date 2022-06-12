import { HexColorString } from "discord.js";
import Settings from "../models/guild-settings";

export async function saveChannel(guildId: string, channelId: string) {
    return await Settings.findByIdAndUpdate(
        guildId,
        {
            _id: guildId,
            channelId: channelId,
        },
        { upsert: true }
    );
}

// 별자리에 관심도 없고 뭐가 뭔지 모르겠어서 그냥 깃허브 gist에 있는거 따왔습니다.
// https://github.com/tindoductran/zodiac/blob/master/getZodiac2.html

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
