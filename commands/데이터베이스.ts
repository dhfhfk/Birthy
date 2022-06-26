import { Client, Interaction, CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton } from "discord.js";
import Settings from "../models/guild-settings";
import Birthdays from "../models/birthdays";
import { getLocaleString as t } from "../utils/localization";
import { sendBirthMessage } from "../utils/function";

module.exports = {
    dev: true,
    name: "데이터베이스",
    description: "[Dev] DB 관리",
    options: [
        {
            name: "birthdays",
            description: "birthdays 스키마",
            type: "SUB_COMMAND_GROUP",
            options: [
                {
                    name: "0626멤버복제",
                    description: "2022-06-26 birthdays스키마 멤버를 settings로 복제 업데이트",
                    type: "SUB_COMMAND",
                },
            ],
        },
    ],

    run: async (client: Client, interaction: CommandInteraction, locale: string) => {
        await interaction.deferReply();

        if (interaction.options.getSubcommandGroup(false)) {
            switch (interaction.options.getSubcommandGroup()) {
                case "birthdays": {
                    switch (interaction.options.getSubcommand()) {
                        case "0626멤버복제": {
                            const settings = await Settings.find().lean();
                            settings.forEach(async (setting) => {
                                const users = await Birthdays.find({ guilds: { $elemMatch: { _id: setting._id } } }).lean();
                                users.forEach(async (user) => {
                                    console.log(setting._id, user._id);
                                    await Settings.findByIdAndUpdate(setting._id, { $addToSet: { members: user._id } });
                                });
                            });
                            return await interaction.editReply({ content: `[DB 관리] - birthdays => settings | ${settings.length}완료` });
                        }
                    }
                }
            }
        }
    },
};
