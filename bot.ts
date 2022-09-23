import { Client, GatewayIntentBits } from "discord.js";
import config from "./config";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// 핸들러 불러오기
["events", "mongo", "localization", "agenda", "koreanbots"].forEach((handler) => {
    try {
        require(`./handlers/${handler}`)(client);
    } catch (e) {
        console.warn(e);
    }
});

export default client;

client.login(config.token);
