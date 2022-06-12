import * as mongoose from "mongoose";

export interface IBirthdays extends mongoose.Document {
    userId: string;
    date: Date;
    allowCreateThread: boolean;
    allowShowAge: boolean;
}

export const BirthdaysSchema = new mongoose.Schema(
    {
        userId: String,
        date: Date,
        allowCreateThread: Boolean,
        allowShowAge: Boolean,
    },
    { versionKey: false }
);

const Birthdays = mongoose.model<IBirthdays>("birthdays", BirthdaysSchema);
export default Birthdays;
