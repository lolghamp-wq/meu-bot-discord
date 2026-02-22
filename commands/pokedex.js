const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");
const JSON_PATH = path.join(__dirname, "..", "pokemon.json");

// ================= CSV =================
function readCSV() {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const linhas = raw.split("\n").map(l => l.trim()).filter(Boolean);

  const header = linhas[0].split(";").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(";").map(c => c.trim());
    const obj = {};
    header.forEach((h, idx) => obj[h] = cols[idx] || "");
    rows.push(obj);
  }

  return rows;
}

const pokedex = readCSV();

// ================= JSON SPAWN =================
const spawns = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

function extractBiome(filter) {
  if (!filter) return [];

  if (filter.value) return [filter.value];

  let result = [];

  if (Array.isArray(filter.any_of)) {
    for (const f of filter.any_of) {
      result = result.concat(extractBiome(f));
    }
  }

  if (Array.isArray(filter.all_of)) {
    for (const f of filter.all_of) {
      result = result.concat(extractBiome(f));
    }
  }

  return result;
}

function acharBiome(id) {
  const conditions = spawns["minecraft:spawn_rules"]?.conditions || [];

  for (const c of conditions) {
    if (!c["minecraft:permute_type"]) continue;

    for (const t of c["minecraft:permute_type"]) {
      if (!t.entity_type) continue;

      if (t.entity_type === `pokemon:p${id}`) {
        const biomes = extractBiome(c["minecraft:biome_filter"]);
        if (biomes.length === 0) return "Desconhecido";
        return [...new Set(biomes)].join(" OU ");
      }
    }
  }

  return "Não spawna";
}

// ================= EMOJIS =================
const TYPE_EMOJIS = {
  grama: "<:grass:1445236750988611655>",
  venenoso: "<:poison:1445236883079565413>",
  fogo: "<:fire:1445236710408454346>",
  agua: "<:water:1445238162690408509>",
  inseto: "<:bug:1445236474898288745>",
  dragao: "<:dragon:1445236597158313984>",
  sombrio: "<:dark:1445236564429901935>",
  eletrico: "<:electric:1445236615407599644>",
  fada: "<:fairy:1445236630771339284>",
  lutador: "<:fighting:1445236652434784336>",
  voador: "<:flying:1445236723981226074>",
  fantasma: "<:ghost:1445236735574540298>",
  pedra: "<:rock:1445236925014343901>",
  aco: "<:steel:1445236950289219707>",
  gelo: "<:ice:1445236799747391602>",
  normal: "<:normal:1445236814142115963>",
  psiquico: "<:psychic:1445236903350763551>",
  terrestre: "<:ground:1445236765874065631>"
};

const TYPE_COLORS = {
  fogo: "#FF6A00",
  agua: "#0099FF",
  grama: "#00C853",
  eletrico: "#FFD600",
  lutador: "#D32F2F",
  dragao: "#7C4DFF",
  gelo: "#00E5FF",
  normal: "#BDBDBD",
  sombrio: "#424242",
  fada: "#FF80AB",
  psiquico: "#E040FB",
  terrestre: "#8D6E63",
  pedra: "#795548",
  aco: "#90A4AE",
  venenoso: "#AA00FF",
  fantasma: "#5C6BC0",
  voador: "#81D4FA",
  inseto: "#AEEA00"
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function iconsFromType(type) {
  if (!type) return "";

  return type
    .split(/[\/|,]/)
    .map(t => normalize(t))
    .map(key => TYPE_EMOJIS[key] || "")
    .join(" ");
}

// ================= COMANDO =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta um Pokémon")
    .addIntegerOption(o =>
      o.setName("numero").setDescription("Número da Pokédex")
    )
    .addStringOption(o =>
      o.setName("nome").setDescription("Nome do Pokémon")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let found = null;

    if (numero) {
      found = pokedex.find(p => Number(p.dex_number) === numero);
    } else if (nome) {
      found = pokedex.find(p =>
        p.name.toLowerCase().includes(nome.toLowerCase())
      );
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    const id = found.dex_number;
    const biome = acharBiome(id);
    const icons = iconsFromType(found.type);

    const mainType = normalize(found.type.split("/")[0]);
    const embedColor = TYPE_COLORS[mainType] || "#00E5FF";

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`📖 #${id} • ${found.name}`)
      .setDescription(`**Tipo:** ${icons} ${found.type}`)
      .addFields(
        { name: "🌍 Bioma de Spawn", value: `\`${biome}\`` }
      )
      .setImage(found.sprite)
      .setFooter({
        text: "CobbleGhost Pokédex • Sistema Oficial",
        iconURL: found.sprite
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
