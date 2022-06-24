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
        await interaction.followUp({ content: `[${("0" + month).slice(-2)}월  ${("0" + day).slice(-2)}일] ${birthdays.length} 유저 찾음` });

        birthdays.forEach((user) => {
            user.guilds.forEach(async (userGuild) => {
                const guildSetting = await Settings.findById(userGuild._id);
                if (!guildSetting) return;

                await sendBirthMessage(user.date, user._id, userGuild._id, guildSetting.channelId, guildSetting.roleId, userGuild.allowShowAge);

                const finishBirthday = client.agenda.create("cleaning birthday", { userId: user._id });
                finishBirthday.schedule("30 seconds after");
                await finishBirthday.save();
            });
        });
        await interaction.editReply({ content: "전송 완료, `30초` 후 테스트 종료 스케줄 등록됨" });
        return;
    },
};
