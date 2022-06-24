import { Client, ApplicationCommandDataResolvable } from "discord.js";
import config from "../config";
import fs from "fs";

module.exports = async (client: Client) => {
    // 빗금 명령어
    const slashCommands = fs.readdirSync("./commands");
    const arrayOfSlashCommands: ApplicationCommandDataResolvable[] = [];
    const arrayOfDevCommands: ApplicationCommandDataResolvable[] = [];

    slashCommands.map((value: string) => {
        import(`../commands/${value.replace(/.ts | .js/g, "")}`).then(async (command) => {
            if (["MESSAGE", "USER"].includes(command.type)) delete command.description;
            if (command.dev) {
                arrayOfDevCommands.push(command);
            } else {
                arrayOfSlashCommands.push(command);
            }
        });
    });

    client.on("ready", async () => {
        if (config.dev_guilds) {
            config.dev_guilds.forEach(async (guild) => {
                await client.guilds.cache.get(guild)?.commands.set(arrayOfDevCommands);
            });
        }

        // 전역 커맨드 셋
        await client.application?.commands.set(arrayOfSlashCommands);
    });
};
