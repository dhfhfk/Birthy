import { Message } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot || message.system) return;
    if (message.content.match(`^(<@!?${client.user?.id}>)\\s*`)) {
        if (!(await Settings.findById(message.guildId))) {
            if (message.member?.permissions.has("ADMINISTRATOR")) {
                await message.reply({ content: "저를 사용하시려면 먼저 `빗금 명령어`로 생일 알림 셋업을 진행해야해요! 아래 이미지를 참조해주세요.", files: ["https://i.ibb.co/ccPWcxM/slash-commands-administrator.png"] });
                return;
            } else {
                await message.reply({ content: "아직 관리자분이 셋업을 진행하지 않아 사용할 수 없어요. 관리자분에게 셋업을 요청해보는건 어떨까요?" });
                return;
            }
        } else {
            await message.reply({ content: "안녕하세요! 생일을 등록하시려면 `빗금 명령어`를 사용해주세요.", files: ["https://i.ibb.co/X3NBvd4/slash-commands-1.png"] });
            return;
        }
    }
    if (message.content.startsWith("/생일")) {
        await message.reply({ content: "저는 `빗금 명령어`로만 사용할 수 있어요! 아래 이미지를 참조해주세요.", files: ["https://i.ibb.co/ccPWcxM/slash-commands-administrator.png"] });
        return;
    }
});
