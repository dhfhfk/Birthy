import Agenda from "agenda";
import { Manager } from "erela.js";

declare module "discord.js" {
    interface Client {
        languages: string[];
        jobs: Agenda;
    }
    interface CommandInteraction {
        member: CacheTypeReducer<Cached, GuildMember>;
        guild: Guild;
    }
    interface ContextMenuInteraction {
        member: CacheTypeReducer<Cached, GuildMember>;
        guild: Guild;
    }
    interface VoiceBasedChannel {
        id: string;
    }
}
