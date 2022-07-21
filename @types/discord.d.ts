import Agenda from "agenda";

declare module "discord.js" {
    interface Client {
        languages: string[];
        agenda: Agenda;
    }
    interface VoiceBasedChannel {
        id: string;
    }
}
