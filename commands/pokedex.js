const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon")
    .addIntegerOption(option =>
      option.setName("id")
      .setDescription("Número do Pokémon (1 a 1025)")
      .setRequired(true)
    ),

  async execute(interaction) {
    const id = interaction.options.getInteger("id");

    const csv = fs.readFileSync("./pokedex1.0.csv", "utf8").split("\n");

    const linha = csv.find(l => l.startsWith(`${id},`));

    if (!linha) {
      return interaction.reply("❌ Pokémon não encontrado.");
    }

    const [numero, nome, tipo] = linha.split(",");

    const embed = new EmbedBuilder()
      .setTitle(`#${numero} - ${nome}`)
      .addFields(
        { name: "Tipo", value: tipo }
      )
      .setThumbnail(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`)
      .setColor("Aqua");

    await interaction.reply({ embeds: [embed] });
  }
};
