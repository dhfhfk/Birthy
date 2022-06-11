import { Manager } from "erela.js";

declare module "discord.js" {
    interface Client {
        manager: Manager;
        languages: string[];
    }
    interface CommandInteraction {
        member: CacheTypeReducer<Cached, GuildMember>;
        guild: Guild;
    }
    interface VoiceBasedChannel {
        id: string;
    }
}
