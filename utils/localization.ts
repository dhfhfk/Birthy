import { User } from "discord.js";
import client from "../bot";

/**
 * 번역된 string을 반환합니다.
 * @param {string} language locale string https://discord.com/developers/docs/reference#locales
 * @param {string} string languages 파일의 키 값
 * @param {?Array} variables {i} 인수에 순서대로 들어갈 값 배열
 * @returns {Promise<string>}
 */
export async function getLocaleString(language: string, string: string, variables?: [string]): Promise<string> {
    // 만약 언어가 존재하지 않는다면 client.languages[0] 언어로 설정
    if (client.languages.indexOf(language) < 0) language = client.languages[0];

    const file = await import(`../languages/${language}`);
    let localeString = file["default"][string];

    if (Array.isArray(localeString)) localeString = localeString[Math.floor(Math.random() * localeString.length)];

    variables?.forEach((v, i) => {
        localeString = localeString.replace(`{${i}}`, v);
    });
    return localeString;
}
