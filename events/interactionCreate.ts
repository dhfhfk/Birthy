import { Interaction } from "discord.js";
import client from "../bot";

client.on("interactionCreate", async (interaction: Interaction) => {
    // 빗금 명령어
    if (interaction.isCommand()) {
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            command.run(client, interaction, interaction.locale);
        });
    }

    if (interaction.isContextMenu()) {
        await interaction.deferReply({ ephemeral: false });
        import(`../commands/${interaction.commandName}`).then(async (command) => {
            if (command) command.run(client, interaction, interaction.locale);
        });
    }
});
