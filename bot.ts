import { Client, Intents } from "discord.js";
import config from "./config";

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES],
});

// 핸들러 불러오기
["events", "slashCommands", "mongo", "localization"].forEach((handler) => {
    try {
        require(`./handlers/${handler}`)(client);
    } catch (e) {
        console.warn(e);
    }
});

export default client;

client.login(config.token);
