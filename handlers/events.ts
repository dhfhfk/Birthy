import * as fs from "fs";

module.exports = async () => {
    // 이벤트
    const eventFiles = await fs.readdirSync("./events").filter((file: string) => file.endsWith(".ts"));
    eventFiles.map((value: string) => require(`../events/${value.replace(".ts", "")}`));
};
