const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon")
    .addIntegerOption(option =>
      option.setName("numero")
        .setDescription("Número da Pokédex")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("nome")
        .setDescription("Nome do Pokémon")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nomeBusca = interaction.options.getString("nome");

    // Lê CSV
    const raw = fs.readFileSync("./pokedex1.0.csv", "utf8");
    const linhas = raw.split(/\r?\n/);

    // Cabeçalho
    const header = linhas[0].split(/,|;|\t/);
    const idxDexNumber = header.indexOf("dex_number");
    const idxName      = header.indexOf("name");
    const idxType      = header.indexOf("type");
    const idxBiome     = header.indexOf("spawn_biome");

    let encontrado = null;

    // ===== MODO 1: BUSCA PELO NÚMERO =====
    if (numero !== null) {
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);
        if (cols[idxDexNumber] == numero) {
          encontrado = cols;
          break;
        }
      }

      if (!encontrado) {
        return interaction.editReply("❌ Pokémon não encontrado pelo número.");
      }
    }

    // ===== MODO 2: BUSCA PELO NOME =====
    else if (nomeBusca !== null) {
      const nomeLower = nomeBusca.toLowerCase();

      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);
        const nomeCsv = cols[idxName].trim().toLowerCase();

        if (nomeCsv.includes(nomeLower)) {
          encontrado = cols;
          break;
        }
      }

      if (!encontrado) {
        return interaction.editReply("❌ Pokémon não encontrado pelo nome.");
      }
    }

    // Nenhuma opção preenchida
    else {
      return interaction.editReply("❌ Você precisa usar **numero** ou **nome**.");
    }

    // Extração dos dados
    const id    = encontrado[idxDexNumber].trim();
    const name  = encontrado[idxName].trim();
    const type  = encontrado[idxType].trim();
    const biome = encontrado[idxBiome].trim();

    // Sprite oficial
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    // Embed estiloso
    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: type, inline: true },
        { name: "Bioma de Spawn", value: biome || "Desconhecido", inline: true }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    return interaction.editReply({ embeds: [embed] });
  }
};
