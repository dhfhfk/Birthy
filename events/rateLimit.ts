import { RateLimitData } from "discord.js";
import client from "../bot";

client.on("rateLimit", async (data: RateLimitData) => {
    console.warn(data);
});
