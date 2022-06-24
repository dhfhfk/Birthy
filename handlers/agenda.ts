import Agenda, { Job } from "agenda";
import client from "../bot";
import Birthdays from "../models/birthdays";
import TodayBirthdays from "../models/today-birthdays";
import Settings from "../models/guild-settings";
import config from "../config";
import { sendBirthMessage } from "../utils/function";
import { Client, User } from "discord.js";

module.exports = async (client: Client) => {
    const agenda = new Agenda({ db: { address: config.mongodb_uri, collection: "jobs" } });

    agenda.define("send today birthday", async (job: Job) => {
        const today = new Date();
        today.setHours(today.getHours() + 9);
        const birthdays = await Birthdays.find({ month: ("0" + (today.getMonth() + 1)).slice(-2), day: ("0" + today.getDate()).slice(-2) });
        console.log(`[오늘 생일] ${birthdays.length} 유저`);
        try {
            birthdays.forEach((user) => {
                user.guilds.forEach(async (userGuild) => {
                    const guildSetting = await Settings.findById(userGuild._id);
                    if (!guildSetting) return;

                    await sendBirthMessage(user.date, user._id, userGuild._id, guildSetting.channelId, guildSetting.roleId, userGuild.allowShowAge);

                    const finishBirthday = agenda.create("cleaning birthday", { userId: user._id });
                    finishBirthday.schedule("1 day after");
                    await finishBirthday.save();
                });
            });
        } catch (e) {
            console.warn(e);
        }
        return;
    });
    agenda.define("cleaning birthday", async (job: Job) => {
        const birthday = await TodayBirthdays.findOne({ userId: job.attrs.data?.userId });
        if (!birthday) return;
        const guild = await client.guilds.fetch(birthday.guildId);
        if (birthday.roleId) {
            const member = await guild.members.fetch(birthday.userId);
            await member.roles.remove(birthday.roleId);
        }
        await birthday.delete();
        return;
    });

    agenda.define("dec modifiedCount", async (job: Job) => {
        const birthday = await Birthdays.findOne({ userId: job.attrs.data?.userId });
        if (!birthday) return;
        await birthday.update({
            modifiedCount: 0,
            lastModifiedAt: new Date(),
        });
        return;
    });

    (async function () {
        await agenda.start();
        await agenda.every("0 0 * * *", "send today birthday");
        client.agenda = agenda;
    })();
};
