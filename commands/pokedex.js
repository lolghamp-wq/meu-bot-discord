const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon pelo número da Pokédex")
    .addIntegerOption(option =>
      option.setName("numero")
        .setDescription("Número da Pokédex (dex_number)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const id = interaction.options.getInteger("numero");

    // Lê CSV
    const raw = fs.readFileSync("./pokedex1.0.csv", "utf8");
    const linhas = raw.split(/\r?\n/);

    // Pega cabeçalho
    const header = linhas[0].split(/,|;|\t/);
    const idxSprite    = header.indexOf("sprite");
    const idxDexNumber = header.indexOf("dex_number");
    const idxName      = header.indexOf("name");
    const idxType      = header.indexOf("type");
    const idxBiome     = header.indexOf("spawn_biome");

    let encontrado = null;

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const cols = linha.split(/,|;|\t/);

      if (cols[idxDexNumber] == id) {
        encontrado = cols;
        break;
      }
    }

    if (!encontrado) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    let sprite = encontrado[idxSprite].trim();

    // ===== CORREÇÃO AUTOMÁTICA ↓↓↓ =====
    sprite = sprite.replace("raw.gith1.pngubusercontent.com", "raw.githubusercontent.com");
    // ===================================

    const name  = encontrado[idxName].trim();
    const type  = encontrado[idxType].trim();
    const biome = encontrado[idxBiome].trim();

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: type, inline: true },
        { name: "Bioma de Spawn", value: biome || "Desconhecido", inline: true }
      );

    return interaction.editReply({ embeds: [embed] });
  }
};
