import Settings from "../../models/guild-settings";
import Birthdays from "../../models/birthdays";
import { Agenda, Job } from "agenda";

module.exports = function (agenda: Agenda) {
    agenda.define("birthday noti", async (job: Job) => {
        // const guildSettings = await Settings.find();
        const today = new Date();
        today.setHours(today.getHours() + 9);
        const birthdays = await Birthdays.find({ code: `${("0" + (today.getMonth() + 1)).slice(-2)}${("0" + today.getDate()).slice(-2)}` });
        console.log(birthdays);
    });
};
