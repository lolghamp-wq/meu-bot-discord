const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Retorna o ping do bot"),

  async execute(interaction) {
    await interaction.deferReply(); // EVITA O ERRO
    await interaction.editReply("🏓 Pong!");
  }
};
