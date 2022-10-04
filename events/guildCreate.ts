import { Point } from "@influxdata/influxdb-client";
import { Guild } from "discord.js";
import client from "../bot";
import { getWriteApi } from "../handlers/influx";

client.on("guildCreate", async (guild: Guild) => {
    const writeApi = getWriteApi("main");
    const guildCreatePoint = new Point("guilds");

    guildCreatePoint.tag("type", "Create").floatField("value", client.guilds.cache.size);

    writeApi.writePoint(guildCreatePoint);
    try {
        await writeApi.close();
    } catch (e: any) {
        console.error(e);
        if (e.statusCode === 401) {
            console.log("Please setup a InfluxDB.");
        }
        console.log("\nFinished ERROR");
    }
});
