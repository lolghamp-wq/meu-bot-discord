// commands/pokedex.js
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = "./pokedex1.0.csv";

// Lê o CSV exatamente como está, sem converter encoding
const rawCsv = fs.readFileSync(CSV_PATH, "utf8");
const rows = parse(rawCsv, {
  columns: true,
  skip_empty_lines: true,
});

// Emojis fixos que você mandou
const TYPE_EMOJIS = {
  bug: "<:bug:1445236474898288745>",
  dragon: "<:dragon:1445236597158313984>",
  dark: "<:dark:1445236564429901935>",
  electric: "<:electric:1445236615407599644>",
  fairy: "<:fairy:1445236630771339284>",
  fighting: "<:fighting:1445236652434784336>",
  fire: "<:fire:1445236710408454346>",
  flying: "<:flying:1445236723981226074>",
  ghost: "<:ghost:1445236735574540298>",
  grass: "<:grass:1445236750988611655>",
  ground: "<:ground:1445236765874065631>",
  ice: "<:ice:1445236799747391602>",
  normal: "<:normal:1445236814142115963>",
  poison: "<:poison:1445236883079565413>",
  psychic: "<:psychic:1445236903350763551>",
  rock: "<:rock:1445236925014343901>",
  steel: "<:steel:1445236950289219707>",
  water: "<:water:1445238162690408509>"
};

// Nome → key
const PT_TO_KEY = {
  "inseto": "bug",
  "dragão": "dragon",
  "dragao": "dragon",
  "sombrio": "dark",
  "elétrico": "electric",
  "eletrico": "electric",
  "fada": "fairy",
  "lutador": "fighting",
  "fogo": "fire",
  "voador": "flying",
  "fantasma": "ghost",
  "planta": "grass",
  "terrestre": "ground",
  "gelo": "ice",
  "normal": "normal",
  "venenoso": "poison",
  "psíquico": "psychic",
  "psiquico": "psychic",
  "pedra": "rock",
  "aço": "steel",
  "aco": "steel",
  "água": "water",
  "agua": "water"
};

// Converte tipo → emoji
function emojiFor(type) {
  if (!type) return "";
  type = type.toLowerCase().trim();
  const key = PT_TO_KEY[type] || type;
  return TYPE_EMOJIS[key] || "";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon")
    .addIntegerOption(o => o.setName("numero").setDescription("Número").setRequired(false))
    .addStringOption(o => o.setName("nome").setDescription("Nome").setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let found = null;

    if (numero != null) {
      found = rows.find(r => Number(r.dex_number) === numero);
    } else if (nome) {
      const lower = nome.toLowerCase();
      found = rows.find(r => (r.name || "").toLowerCase().includes(lower));
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    const id = found.dex_number;
    const sprite =
      found.sprite ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    const type1 = found.type1 || found.type || "";
    const type2 = found.type2 || "";

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${found.name}`)
      .setThumbnail(sprite)
      .addFields(
        {
          name: "Tipo",
          value:
            `${emojiFor(type1)} ${type1}` +
            (type2 ? ` | ${emojiFor(type2)} ${type2}` : "")
        },
        {
          name: "Bioma de Spawn",
          value: found.spawn_biome || "Não informado"
        }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    return interaction.editReply({ embeds: [embed] });
  }
};
