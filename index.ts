import { ShardingManager } from "discord.js";
import config from "./config";

const manager = new ShardingManager("dist/bot.js", { token: config.token });

manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

manager.spawn();
