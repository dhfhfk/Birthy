import * as mongoose from "mongoose";

export interface ISettings extends mongoose.Document {
    _id: string;
    isSetup: boolean;
    channelId: string;
    roleId: string;
    roleNameType: "emoji" | "name" | "both";
    zodiacRoles: [string];
    birthstoneRoles: [string];
    allowCreateThread: boolean;
    allowCeleMessage: boolean;
    isPremium: boolean;
    premiumExpiryDate: Date;
}

export const SettingsSchema = new mongoose.Schema(
    {
        _id: String,
        isSetup: Boolean,
        channelId: String,
        roleId: String,
        roleNameType: String,
        zodiacRoles: [String],
        birthstoneRoles: [String],
        allowCreateThread: Boolean,
        allowCeleMessage: Boolean,
        isPremium: Boolean,
        premiumExpiryDate: Date,
    },
    { versionKey: false }
);

const Settings = mongoose.model<ISettings>("settings", SettingsSchema);
export default Settings;
