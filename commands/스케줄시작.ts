import { Client, Interaction, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays, { IBirthdays } from "../models/birthdays";
import { getLocaleString as t } from "../utils/localization";
import { sendBirthMessage } from "../utils/function";

module.exports = {
    dev: true,
    name: "스케줄시작",
    description: "[Dev] 스케줄시작 혹은 테스트",
    options: [
        {
            name: "날짜",
            description: "날짜로 찾기",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "날짜",
                    description: "MMDD 형식",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "test",
                    description: "테스트 여부",
                    type: "BOOLEAN",
                    required: false,
                },
            ],
        },
        {
            name: "유저",
            description: "유저 Id로 찾기",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "userid",
                    description: "Snowflake UserId",
                    type: "STRING",
                    required: true,
                },
                {
                    name: "test",
                    description: "테스트 여부",
                    type: "BOOLEAN",
                    required: false,
                },
            ],
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        await interaction.deferReply({ ephemeral: true });

        let birthdays: (IBirthdays & { _id: string })[] | null;
        let isTest = false;

        if (interaction.options.getBoolean("test", false)) isTest = true;

        switch (interaction.options.getSubcommand()) {
            case "날짜": {
                const inputDate = interaction.options.getString("날짜", true);
                if (inputDate.length !== 4) return await interaction.editReply({ content: "잘못된 입력, MMDD 형식으로 입력하세요." });

                const month = Number(inputDate?.substring(0, 2));
                const day = Number(inputDate?.substring(2, 4));
                const today = new Date();

                today.setHours(today.getHours() + 9);
                birthdays = await Birthdays.find({ month: month, day: day });
                if (!birthdays || birthdays.length <= 0) return await interaction.editReply({ content: `[${("0" + month).slice(-2)}월  ${("0" + day).slice(-2)}일] 결과 없음` });
                const users = birthdays.map((b) => {
                    return `${b._id}`;
                });
                await interaction.editReply({
                    content: `[${isTest ? "테스트" : ""} ${("0" + month).slice(-2)}월  ${("0" + day).slice(-2)}일] ${birthdays.length} 유저\n${users ? users.join(", ") : ""}`,
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setCustomId(`${interaction.id}-test-false`).setLabel("취소").setStyle("SECONDARY"),
                            new MessageButton().setCustomId(`${interaction.id}-test-true`).setLabel("전송").setStyle("PRIMARY").setEmoji("<:cakeprogress:985470905314603018>")
                        ),
                    ],
                });

                break;
            }
            case "유저": {
                const userId = interaction.options.getString("userid", true);
                if (userId.length !== 18) return await interaction.editReply({ content: "잘못된 입력, 18자리의 userId를 입력하세요." });

                birthdays = await Birthdays.find({ _id: userId });
                if (!birthdays || birthdays.length <= 0) return await interaction.editReply({ content: "결과 없음" });
                await interaction.editReply({
                    content: `${isTest ? "테스트" : ""} ${userId} 유저`,
                    components: [
                        new MessageActionRow().addComponents(
                            new MessageButton().setCustomId(`${interaction.id}-test-false`).setLabel("취소").setStyle("SECONDARY"),
                            new MessageButton().setCustomId(`${interaction.id}-test-true`).setLabel("전송").setStyle("PRIMARY").setEmoji("<:cakeprogress:985470905314603018>")
                        ),
                    ],
                });
                break;
            }
        }

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

            if (!birthdays) return;

            const results = await Promise.all(
                birthdays.map(async (user) => {
                    const result = await sendBirthMessage(user._id);
                    const finishBirthday = client.agenda.create("cleaning birthday", { userId: user._id });
                    if (isTest) {
                        finishBirthday.schedule("30 seconds after");
                    } else {
                        finishBirthday.schedule("1 day after");
                    }

                    await finishBirthday.save();
                    return result.success ? "성공" : `실패, ${result.message}`;
                })
            );
            await interaction.editReply({ content: `전송 완료, ${isTest ? "`30초` 후 테스트 종료" : ""}스케줄 등록됨\n${results.join("\n")}` });
            return;
        });
    },
};
