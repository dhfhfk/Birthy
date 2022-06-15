import * as mongoose from "mongoose";

export interface IBirthdays extends mongoose.Document {
    _id: string;
    date: Date;
    roles: [string];
    guilds: [string];
    lastModifiedAt: Date;
    modifiedCount: number;
    allowCreateThread: boolean;
    allowShowAge: boolean;
}

export const BirthdaysSchema = new mongoose.Schema(
    {
        _id: String,
        date: Date,
        roles: [String],
        guilds: [String],
        lastModifiedAt: Date,
        modifiedCount: Number,
        allowCreateThread: Boolean,
        allowShowAge: Boolean,
    },
    { versionKey: false }
);

const Birthdays = mongoose.model<IBirthdays>("birthdays", BirthdaysSchema);
export default Birthdays;
