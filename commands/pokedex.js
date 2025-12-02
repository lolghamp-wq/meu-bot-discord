const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

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

    // LER CSV EM latin1 (corrige acentos)
    const raw = fs.readFileSync("./pokedex1.0.csv", "latin1");
    const linhas = raw.split(/\r?\n/);

    const header = linhas[0].split(/,|;|\t/);

    const idxDexNumber = header.indexOf("dex_number");
    const idxName = header.indexOf("name");
    const idxType = header.indexOf("type");
    const idxBiome = header.indexOf("spawn_biome");

    let encontrado = null;

    // ----- BUSCA POR NÚMERO -----
    if (numero !== null) {
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);
        if (cols[idxDexNumber] == numero) {
          encontrado = cols;
          break;
        }
      }
      if (!encontrado) return interaction.editReply("❌ Pokémon não encontrado pelo número.");
    }

    // ----- BUSCA POR NOME -----
    else if (nomeBusca !== null) {
      const nomeLower = nomeBusca.trim().toLowerCase();
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);
        if (!cols[idxName]) continue;

        const nomeCsv = cols[idxName].trim().toLowerCase();
        if (nomeCsv.includes(nomeLower)) {
          encontrado = cols;
          break;
        }
      }
      if (!encontrado) return interaction.editReply("❌ Pokémon não encontrado pelo nome.");
    }

    else return interaction.editReply("❌ Você precisa usar **numero** ou **nome**.");

    // ====== PEGAR DADOS ======
    const id = encontrado[idxDexNumber].trim();
    const name = encontrado[idxName].trim();
    const biome = encontrado[idxBiome].trim() || "não spawna";

    // ====== TRATAR TIPOS ======
    const tiposBrutos = encontrado[idxType].trim(); // ex: "Fogo/Água"
    const tipos = tiposBrutos.split("/").map(t => t.trim().toLowerCase());

    // ====== MAPA DE TIPO -> ARQUIVO PNG ======
    const mapIcons = {
      "inseto": "bug.png",
      "sombrio": "dark.png",
      "dragão": "dragon.png",
      "elétrico": "electric.png",
      "fada": "fairy.png",
      "lutador": "fighting.png",
      "fogo": "fire.png",
      "voador": "flying.png",
      "fantasma": "ghost.png",
      "planta": "grass.png",
      "terra": "ground.png",
      "terrestre": "ground.png",
      "gelo": "ice.png",
      "normal": "normal.png",
      "venenoso": "poison.png",
      "psíquico": "psychic.png",
      "pedra": "rock.png",
      "aço": "steel.png",
      "água": "water.png"
    };

    // ====== GERAR TEXTO DOS TIPOS ======
    const tipoFormatado = tipos
      .map(t => {
        const file = mapIcons[t];
        if (!file) return `❓ ${t}`;
        const url = `https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/${file}`;
        return `![${t}](${url}) **${t.charAt(0).toUpperCase() + t.slice(1)}**`;
      })
      .join(" | ");

    // URL DO SPRITE OFICIAL
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    // ===== EMBED FINAL =====
    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: tipoFormatado, inline: false },
        { name: "Bioma de Spawn", value: biome, inline: false }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    return interaction.editReply({ embeds: [embed] });
  }
};
