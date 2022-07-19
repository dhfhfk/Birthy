import client from "../bot";

client.rest.on("rateLimited", async (data: any) => {
    console.warn(data);
});
