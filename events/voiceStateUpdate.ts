import { VoiceState } from "discord.js";
import client from "../bot";
import Settings from "../models/guild-settings";

client.on("voiceStateUpdate", async (oldState: VoiceState, newState: VoiceState) => {
    // voiceStateUpdate
});
