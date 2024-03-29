import * as mongoose from "mongoose";

export interface ISettings extends mongoose.Document {
    _id: string;
    isSetup: boolean;
    members: string[];
    channelId: string;
    logChannelId: string;
    roleId: string;
    subRole: boolean;
    zodiacRoles: [{ _id: string, roleId: string }];
    birthstoneRoles: [{ _id: string, roleId: string }];
    allowHideAge: boolean;
    allowCeleMessage: boolean;
    isPremium: boolean;
    premiumExpiryDate: Date;
}

export const SettingsSchema = new mongoose.Schema(
    {
        _id: String,
        isSetup: Boolean,
        members: [String],
        channelId: String,
        logChannelId: String,
        roleId: String,
        subRole: Boolean,
        zodiacRoles: [
            {
                _id: String,
                roleId: String,
            },
        ],
        birthstoneRoles: [
            {
                _id: String,
                roleId: String,
            },
        ],
        allowHideAge: Boolean,
        allowCeleMessage: Boolean,
        isPremium: Boolean,
        premiumExpiryDate: Date,
    },
    { versionKey: false }
);

const Settings = mongoose.model<ISettings>("settings", SettingsSchema);
export default Settings;
