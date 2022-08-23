import { Message } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";

client.on("messageCreate", async (message: Message) => {
    if (message.author.bot || message.system) return;
    if (message.content.match(`^(<@!?${client.user?.id}>)\\s*`)) {
        if (!(await Settings.findById(message.guildId))) {
            if (message.member?.permissions.has("Administrator")) {
                await message.reply({ content: "저를 사용하시려면 먼저 `빗금 명령어`로 기본 생일 셋업을 진행해야해요! 아래 이미지를 참조해주세요.", files: ["https://i.ibb.co/p2XfF2g/slash-commands-administrator.png"] });
                return;
            } else {
                await message.reply({ content: "아직 관리자분이 셋업을 진행하지 않아 사용할 수 없어요. 관리자분에게 셋업을 요청해보는건 어떨까요?" });
                return;
            }
        } else {
            await message.reply({ content: "안녕하세요! 생일을 등록하시려면 `빗금 명령어`를 사용해주세요.", files: ["https://i.ibb.co/JnDGfJj/1-slash-commands-1.png"] });
            return;
        }
    }
    if (message.content.startsWith("/생일")) {
        await message.reply({
            content: "__**채팅으로 전송하는 게 아니에요!!!**__저는 `빗금 명령어`로만 사용할 수 있어요! `/`를 입력하고 조금 기다리면 창이 나타날 거예요. 아래 이미지를 참조해주세요.",
            files: ["https://i.ibb.co/JnDGfJj/1-slash-commands-1.png"],
        });
        return;
    }
});
