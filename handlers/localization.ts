import { Client } from "discord.js";
import config from "../config";

module.exports = async (client: Client) => {
    client.languages = config.languages;
};
