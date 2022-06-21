import * as fs from "fs";

module.exports = async () => {
    // 이벤트
    const eventFiles = await fs.readdirSync("./events");
    eventFiles.map((value: string) => require(`../events/${value.replace(/.ts | .js/g, "")}`));
};
