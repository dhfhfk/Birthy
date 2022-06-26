import { Client, Interaction, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { getLocaleString as t } from "../utils/localization";
import { sendBirthMessage } from "../utils/function";

module.exports = {
    dev: true,
    name: "스케줄테스트",
    description: "[Dev] 스케줄테스트",
    options: [
        {
            name: "날짜",
            description: "MMDD 형식",
            type: "STRING",
            required: true,
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        const inputDate = interaction.options.getString("날짜", true);

        if (inputDate.length !== 4) return await interaction.editReply({ content: "잘못된 입력, MMDD 형식으로 입력하세요." });

        const month = Number(inputDate?.substring(0, 2));
        const day = Number(inputDate?.substring(2, 4));
        const today = new Date();

        today.setHours(today.getHours() + 9);
        const birthdays = await Birthdays.find({ month: month, day: day });

        if (birthdays.length <= 0) return await interaction.editReply({ content: `[${("0" + month).slice(-2)}월  ${("0" + day).slice(-2)}일] 결과 없음` });

        const users = birthdays.map((b) => {
            return `${b._id}`;
        });
        await interaction.editReply({
            content: `[${("0" + month).slice(-2)}월  ${("0" + day).slice(-2)}일] ${birthdays.length} 유저
${users ? users.join(", ") : ""}`,
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton().setCustomId(`${interaction.id}-test-false`).setLabel("취소").setStyle("SECONDARY"),
                    new MessageButton().setCustomId(`${interaction.id}-test-true`).setLabel("전송").setStyle("PRIMARY").setEmoji("<:cakeprogress:985470905314603018>")
                ),
            ],
        });

        const filter = (i: MessageComponentInteraction) => i.customId.startsWith(interaction.id);

        const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 300000 });
        collector?.on("collect", async (i: MessageComponentInteraction) => {
            const options = i.customId.split("-");
            if (!options[0].startsWith(interaction.id)) return;

            if (!JSON.parse(options[2])) {
                await interaction.editReply({ content: "취소됨", components: [] });
                return;
            }
            await interaction.editReply({ content: "전송 중...", components: [] });

            const results = await Promise.all(
                birthdays.map(async (user) => {
                    const result = await sendBirthMessage(user._id);
                    return result.success ? "성공" : `실패, ${result.message}`;
                })
            );
            await interaction.editReply({ content: `전송 완료, \`30초\` 후 테스트 종료 스케줄 등록됨\n${results.join("\n")}` });
            return;
        });
    },
};
