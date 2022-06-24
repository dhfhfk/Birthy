import { Client } from "discord.js";
import { Koreanbots } from "koreanbots";
import config from "../config";

module.exports = async (client: Client) => {
    if (!config.koreanbots_token) return;
    client.on("ready", () => {
        const koreanbots = new Koreanbots({
            api: {
                token: config.koreanbots_token,
            },
            clientID: client.user!.id,
        });

        const update = (servers: number) =>
            koreanbots.mybot
                .update({ servers, shards: client.shard?.count })
                .then((res) => console.log("서버 수를 정상적으로 업데이트하였습니다!\n반환된 정보:" + JSON.stringify(res)))
                .catch(console.error);

        update(client.guilds.cache.size); // 준비 상태를 시작할 때, 최초로 업데이트합니다.
        setInterval(() => update(client.guilds.cache.size), 1200000); // 20분마다 서버 수를 업데이트합니다.
    });
};
