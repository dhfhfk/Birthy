import * as mongoose from "mongoose";

export interface IBirthdays extends mongoose.Document {
    _id: string;
    date: Date;
    month: number;
    day: number;
    roles: [string];
    guilds: [
        {
            _id: string;
            allowShowAge: boolean;
        }
    ];
    lastModifiedAt: Date;
    modifiedCount: number;
    allowCreateThread: boolean;
}

export const BirthdaysSchema = new mongoose.Schema(
    {
        _id: String,
        date: Date,
        month: Number,
        day: Number,
        roles: [String],
        guilds: [
            {
                _id: String,
                allowShowAge: Boolean,
            },
        ],
        lastModifiedAt: Date,
        modifiedCount: Number,
        allowCreateThread: Boolean,
    },
    { versionKey: false }
);

const Birthdays = mongoose.model<IBirthdays>("birthdays", BirthdaysSchema);
export default Birthdays;
