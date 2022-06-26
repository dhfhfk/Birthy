import * as mongoose from "mongoose";

export interface ITodayBirthdays extends mongoose.Document {
    userId: string;
    guildId: string;
    threadId: string;
    messageId: string;
    roleId: string;
    createdAt: Date;
}

export const TodayBirthdaysSchema = new mongoose.Schema(
    {
        userId: String,
        guildId: String,
        threadId: String,
        messageId: String,
        roleId: String,
    },
    { versionKey: false, timestamps: true }
);

const TodayBirthdays = mongoose.model<ITodayBirthdays>("today_birthdays", TodayBirthdaysSchema);
export default TodayBirthdays;
