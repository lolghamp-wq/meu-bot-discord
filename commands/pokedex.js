const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Emojis de tipos
const TYPE_EMOJIS = {
  bug: "<:bug:1445236474898288745>",
  dragon: "<:dragon:1445236597158313984>",
  fairy: "<:fairy:1445236630771339284>",
  fire: "<:fire:1445236710408454346>",
  ghost: "<:ghost:1445236735574540298>",
  rock: "<:rock:1445236925014343901>",
  dark: "<:dark:1445236564429901935>",
  electric: "<:electric:1445236615407599644>",
  fighting: "<:fighting:1445236652434784336>",
  flying: "<:flying:1445236723981226074>",
  grass: "<:grass:1445236750988611655>",
  ground: "<:ground:1445236765874065631>",
  ice: "<:ice:1445236799747391602>",
  normal: "<:normal:1445236814142115963>",
  poison: "<:poison:1445236883079565413>",
  psychic: "<:psychic:1445236903350763551>",
  steel: "<:steel:1445236950289219707>",
  water: "<:water:1445238162690408509>"
};

// Tradução tipos
const TYPE_MAP = {
  "dragao": "dragon",
  "dragão": "dragon",
  "fogo": "fire",
  "voador": "flying",
  "lutador": "fighting",
  "fantasma": "ghost",
  "agua": "water",
  "água": "water",
  "psiquico": "psychic",
  "psíquico": "psychic",
  "terra": "ground",
  "pedra": "rock",
  "planta": "grass",
  "gelo": "ice",
  "normal": "normal",
  "inseto": "bug",
  "venenoso": "poison",
  "metal": "steel",
  "fada": "fairy",
  "sombrio": "dark"
};

// Lê o CSV
function loadCSV() {
  let raw = fs.readFileSync("./pokedex1.1.csv", "utf8");
  raw = raw.replace(/^\uFEFF/, ""); // remove BOM

  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  // pulando o cabeçalho
  const rows = lines.slice(1).map(line => {
    const [sprite, num, biome, dex, nameType] = line.split(";");

    let [name, types] = nameType.split(":");
    const [t1, t2] = types ? types.split("/") : ["", ""];

    return {
      sprite: sprite.trim(),
      num: Number(num.trim()),
      biome: biome.trim(),
      dex: Number(dex.trim()),
      name: name.trim(),
      type1: t1?.trim().toLowerCase(),
      type2: t2?.trim().toLowerCase()
    };
  });

  return rows;
}

const rows = loadCSV();

// Emoji converter
function emoji(type) {
  if (!type) return "";
  const norm = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const key = TYPE_MAP[norm] || norm;
  return TYPE_EMOJIS[key] || "";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta um Pokémon")
    .addIntegerOption(opt =>
      opt.setName("numero").setDescription("Número da Pokédex").setRequired(false))
    .addStringOption(opt =>
      opt.setName("nome").setDescription("Nome do Pokémon").setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let pkm = null;

    if (numero != null) {
      pkm = rows.find(r => r.dex === numero || r.num === numero);
    } else if (nome) {
      const n = nome.toLowerCase();
      pkm = rows.find(r => r.name.toLowerCase().includes(n));
    }

    if (!pkm) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    const e1 = emoji(pkm.type1);
    const e2 = emoji(pkm.type2);

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${pkm.dex} - ${pkm.name}`)
      .setThumbnail(pkm.sprite)
      .addFields(
        { name: "Tipo", value: `${e1} ${pkm.type1} ${pkm.type2 ? `| ${e2} ${pkm.type2}` : ""}` },
        { name: "Bioma de Spawn", value: pkm.biome || "Desconhecido" }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
