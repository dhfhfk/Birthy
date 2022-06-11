import * as mongoose from "mongoose";

export interface ISettings extends mongoose.Document {
    _id: string;
    categoryId: string;
    logChannelId: string;
    isEnabled: boolean;
}

export const SettingsSchema = new mongoose.Schema(
    {
        _id: String,
        categoryId: String,
        logChannelId: String,
        isEnabled: Boolean,
    },
    { versionKey: false }
);

const Settings = mongoose.model<ISettings>("settings", SettingsSchema);
export default Settings;
