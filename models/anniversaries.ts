import * as mongoose from "mongoose";

export interface IAnniversaries extends mongoose.Document {
    userId: string;
    date: Date;
    allowCreateThread: boolean;
    participants: [string];
}

export const AnniversariesSchema = new mongoose.Schema(
    {
        userId: String,
        date: Date,
        allowCreateThread: Boolean,
        participants: [String],
    },
    { versionKey: false }
);

const Anniversaries = mongoose.model<IAnniversaries>("birthdays", AnniversariesSchema);
export default Anniversaries;
