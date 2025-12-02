const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

// -----------------------------
// MAPA: Tipo PT → Tipo EN
// -----------------------------
const typeMap = {
  "Normal": "Normal",
  "Fogo": "Fire",
  "Água": "Water",
  "Grama": "Grass",
  "Elétrico": "Electric",
  "Gelo": "Ice",
  "Lutador": "Fighting",
  "Lutadora": "Fighting",
  "Voador": "Flying",
  "Veneno": "Poison",
  "Terra": "Ground",
  "Pedra": "Rock",
  "Psíquico": "Psychic",
  "Inseto": "Bug",
  "Fantasma": "Ghost",
  "Metálico": "Steel",
  "Aço": "Steel",
  "Dragão": "Dragon",
  "Sombrio": "Dark",
  "Trevas": "Dark",
  "Fada": "Fairy"
};

// -----------------------------
// ÍCONES OFICIAIS DOS TIPOS
// -----------------------------
const typeIcons = {
  Normal:   "https://play.pokemonshowdown.com/sprites/types/Normal.png",
  Fire:     "https://play.pokemonshowdown.com/sprites/types/Fire.png",
  Water:    "https://play.pokemonshowdown.com/sprites/types/Water.png",
  Electric: "https://play.pokemonshowdown.com/sprites/types/Electric.png",
  Grass:    "https://play.pokemonshowdown.com/sprites/types/Grass.png",
  Ice:      "https://play.pokemonshowdown.com/sprites/types/Ice.png",
  Fighting: "https://play.pokemonshowdown.com/sprites/types/Fighting.png",
  Poison:   "https://play.pokemonshowdown.com/sprites/types/Poison.png",
  Ground:   "https://play.pokemonshowdown.com/sprites/types/Ground.png",
  Flying:   "https://play.pokemonshowdown.com/sprites/types/Flying.png",
  Psychic:  "https://play.pokemonshowdown.com/sprites/types/Psychic.png",
  Bug:      "https://play.pokemonshowdown.com/sprites/types/Bug.png",
  Rock:     "https://play.pokemonshowdown.com/sprites/types/Rock.png",
  Ghost:    "https://play.pokemonshowdown.com/sprites/types/Ghost.png",
  Dragon:   "https://play.pokemonshowdown.com/sprites/types/Dragon.png",
  Dark:     "https://play.pokemonshowdown.com/sprites/types/Dark.png",
  Steel:    "https://play.pokemonshowdown.com/sprites/types/Steel.png",
  Fairy:    "https://play.pokemonshowdown.com/sprites/types/Fairy.png"
};

// -----------------------------
// Função que formata os tipos com ícones
// -----------------------------
function gerarTiposFormatados(tipoString) {
  if (!tipoString) return "Desconhecido";

  // Divide "Fogo/Dragão", remove espaços
  const tiposPt = tipoString.split(/\/|\\/).map(t => t.trim());

  const formatado = tiposPt.map(tp => {
    const en = typeMap[tp]; // PT → EN
    if (!en) return tp; // caso não mapeado

    const icon = typeIcons[en];
    return `[‎](${icon}) **${tp}**`; // o [ ] faz o Discord renderizar o ícone pequenininho
  });

  return formatado.join("\n");
}

// -----------------------------
// COMANDO PRINCIPAL
// -----------------------------
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

    // Ler CSV com acentos corretos
    const raw = fs.readFileSync("./pokedex1.0.csv", "latin1");
    const linhas = raw.split(/\r?\n/);

    const header = linhas[0].split(/,|;|\t/);

    const idxDexNumber = header.indexOf("dex_number");
    const idxName      = header.indexOf("name");
    const idxType      = header.indexOf("type");
    const idxBiome     = header.indexOf("spawn_biome");

    let encontrado = null;

    // Pesquisa por número
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

    // Pesquisa por nome
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

    else {
      return interaction.editReply("❌ Você precisa usar **numero** ou **nome**.");
    }

    // Dados
    const id    = encontrado[idxDexNumber].trim();
    const name  = encontrado[idxName].trim();
    const type  = encontrado[idxType].trim();
    const biome = encontrado[idxBiome].trim();

    // Sprite oficial
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    // ---------- EMBED ----------
    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: gerarTiposFormatados(type), inline: true },
        { name: "Bioma de Spawn", value: biome || "Desconhecido", inline: true }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    return interaction.editReply({ embeds: [embed] });
  }
};
