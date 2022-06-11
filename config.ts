import "dotenv/config";

export interface Config {
    token: string;
    mongodb_uri: string;
    languages: string[];
}

export default {
    token: process.env.TOKEN,
    mongodb_uri: process.env.MONGODB_URI,
    languages: ["ko", "en-US"],
} as Config;
