import { ActivityType } from "discord.js";
import client from "../bot";

client.on("ready", () => {
    console.log(`${client.user?.tag} 준비됨`);
    client.user?.setPresence({ status: "online", activities: [{ name: "/생일 등록", type: ActivityType.Playing }] });
});
