import { Client, ApplicationCommandDataResolvable } from "discord.js";
import fs from "fs";

module.exports = async (client: Client) => {
    // 빗금 명령어
    const slashCommands = fs.readdirSync("./commands").filter((file: string) => file.endsWith(".ts"));
    const arrayOfSlashCommands: ApplicationCommandDataResolvable[] = [];

    slashCommands.map((value: string) => {
        import(`../commands/${value.replace(".ts", "")}`).then(async (command) => {
            if (["MESSAGE", "USER"].includes(command.type)) delete command.description;
            arrayOfSlashCommands.push(command);
        });
    });

    client.on("ready", async () => {
        // await client.guilds.cache.get("길드 커맨드 셋을 위한 Guild Id")?.commands.set(arrayOfSlashCommands);

        // 전역 커맨드 셋
        await client.application?.commands.set(arrayOfSlashCommands);
    });
};
