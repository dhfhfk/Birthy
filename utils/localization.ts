import client from "../bot";

async function getLocaleString(language: string, string: string, variables?: [string]): Promise<string> {
    // 만약 언어가 존재하지 않는다면 client.languages[0] 언어로 설정
    if (client.languages.indexOf(language) < 0) language = client.languages[0];

    const file = await import(`../languages/${language}`);
    let localeString = file["default"][string];
    variables?.forEach((v, i) => {
        localeString = localeString.replace(`{${i}}`, v);
    });
    return localeString;
}

export { getLocaleString };
