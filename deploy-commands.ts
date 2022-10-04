import { REST, Routes, ApplicationCommandDataResolvable } from "discord.js";
import config from "./config";
import fs from "fs";

const slashCommands = fs.readdirSync("./commands");
const arrayOfSlashCommands: ApplicationCommandDataResolvable[] = [];
const arrayOfDevCommands: ApplicationCommandDataResolvable[] = [];

slashCommands.map((value: string) => {
    const command = require(`./commands/${value.replace(/.ts | .js/g, "")}`);
    if (command.run) delete command.run;

    if (command.dev) {
        arrayOfDevCommands.push(command);
    } else {
        arrayOfSlashCommands.push(command);
    }
});

const rest = new REST({ version: "10" }).setToken(config.token);

if (config.dev_guilds) {
    console.log(`${config.dev_guilds.length}개의 길드에 ${arrayOfDevCommands.length}개의 개발자 명령어 등록 중...`);
    config.dev_guilds.forEach(async (guild) => {
        rest.put(Routes.applicationGuildCommands(config.client_id, guild), { body: arrayOfDevCommands })
            .then(() => console.log("개발자 명령어 등록됨"))
            .catch(console.error);
    });
}

console.log(`${arrayOfSlashCommands.length}개의 전역 명령어 등록 중...`);
rest.put(Routes.applicationCommands(config.client_id), { body: arrayOfSlashCommands })
    .then(() => {
        console.log("전역 명령어 등록됨.");
        process.exit(0);
    })
    .catch(console.error);
