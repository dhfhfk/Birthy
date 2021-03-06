import * as mongoose from "mongoose";

export interface IAnniversaries extends mongoose.Document {
    _id: string;
    date: Date;
    allowCreateThread: boolean;
    participants: [string];
}

export const AnniversariesSchema = new mongoose.Schema(
    {
        _id: String,
        date: Date,
        allowCreateThread: Boolean,
        participants: [String],
    },
    { versionKey: false }
);

const Anniversaries = mongoose.model<IAnniversaries>("birthdays", AnniversariesSchema);
export default Anniversaries;
