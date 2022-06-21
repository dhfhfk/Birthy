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
        // const birthdays = await Birthdays.find({ month: ("0" + (today.getMonth() + 1)).slice(-2), day: ("0" + today.getDate()).slice(-2)} );
        const birthdays = await Birthdays.find({ month: 12, day: 3 }).lean();
        console.log(`[오늘 생일] ${birthdays.length} 유저`);

        birthdays.forEach((user) => {
            user.guilds.forEach(async (userGuild) => {
                const guildSetting = await Settings.findById(userGuild._id);
                if (!guildSetting) return;

                await sendBirthMessage(user.date, user._id, userGuild._id, guildSetting.channelId, guildSetting.roleId, userGuild.allowShowAge);

                const finishBirthday = await agenda.create("cleaning birthday", { userId: user._id });
                await finishBirthday.schedule("10 seconds after");
                await finishBirthday.save();
            });
        });
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

    (async function () {
        await agenda.start();
        await agenda.now("send today birthday", "");
        await agenda.every("0 0 * * *", "send today birthday");
        client.jobs = agenda;
    })();
};
