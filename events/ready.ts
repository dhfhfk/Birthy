import client from "../bot";

client.on("ready", () => {
    console.log(`${client.user?.tag} 준비됨`);
    client.user?.setPresence({ status: "dnd" });
});
