const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");
const JSON_PATH = path.join(__dirname, "..", "pokemon.json");

// ================= NORMALIZAR TEXTO =================
function normalize(text) {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ================= LER CSV =================
function readCSV() {
  const raw = fs.readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const linhas = raw.split(/\r?\n/).filter(Boolean);

  const sep = linhas[0].includes(";") ? ";" : ",";

  const headers = linhas[0]
    .split(sep)
    .map(h => normalize(h).replace(/\s+/g, "_"))
    .filter(h => h !== "");

  const rows = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(sep);
    const obj = {};

    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ? cols[idx].trim() : "";
    });

    rows.push(obj);
  }

  return rows;
}

const pokedex = readCSV();

// ================= SPAWNS =================
let spawns = {};
try {
  spawns = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
} catch {
  spawns = {};
}

function extractBiome(filter) {
  if (!filter) return [];

  if (filter.value) return [filter.value];

  let res = [];

  if (Array.isArray(filter.any_of)) {
    filter.any_of.forEach(f => res.push(...extractBiome(f)));
  }

  if (Array.isArray(filter.all_of)) {
    filter.all_of.forEach(f => res.push(...extractBiome(f)));
  }

  return res;
}

function acharBiome(id) {
  const conditions = spawns?.["minecraft:spawn_rules"]?.conditions || [];

  for (const c of conditions) {
    if (!c["minecraft:permute_type"]) continue;

    for (const t of c["minecraft:permute_type"]) {
      if (t.entity_type === `pokemon:p${id}`) {
        const biomes = extractBiome(c["minecraft:biome_filter"]);
        return biomes.length ? [...new Set(biomes)].join(" OR ") : "Unknown";
      }
    }
  }

  return "Does not spawn";
}

// ================= EMOJIS =================
const TYPE_EMOJIS = {
  grass: "<:grass:1445236750988611655>",
  poison: "<:poison:1445236883079565413>",
  fire: "<:fire:1445236710408454346>",
  water: "<:water:1445238162690408509>",
  bug: "<:bug:1445236474898288745>",
  dragon: "<:dragon:1445236597158313984>",
  dark: "<:dark:1445236564429901935>",
  electric: "<:electric:1445236615407599644>",
  fairy: "<:fairy:1445236630771339284>",
  fighting: "<:fighting:1445236652434784336>",
  flying: "<:flying:1445236723981226074>",
  ghost: "<:ghost:1445236735574540298>",
  rock: "<:rock:1445236925014343901>",
  steel: "<:steel:1445236950289219707>",
  ice: "<:ice:1445236799747391602>",
  normal: "<:normal:1445236814142115963>",
  psychic: "<:psychic:1445236903350763551>",
  ground: "<:ground:1445236765874065631>"
};

function typeIcons(type) {
  if (!type) return "";
  return type
    .split(/[\/|,]/)
    .map(t => TYPE_EMOJIS[normalize(t)] || "")
    .join(" ");
}

// ================= COMANDO =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consult a Pokémon")
    .addIntegerOption(o =>
      o.setName("number").setDescription("Pokédex number")
    )
    .addStringOption(o =>
      o.setName("name").setDescription("Pokémon name")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const number = interaction.options.getInteger("number");
    const name = interaction.options.getString("name");

    let found = null;

    if (number) {
      found = pokedex.find(p => Number(p.dex_number) == number);
    } else if (name) {
      found = pokedex.find(p =>
        normalize(p.name).includes(normalize(name))
      );
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon not found.");
    }

    const id = found.dex_number;
    const biome = acharBiome(id);

    const hp = Number(found.hp || 0);
    const atk = Number(found.attack || 0);
    const def = Number(found.defense || 0);
    const spa = Number(found.special_attack || 0);
    const spd = Number(found.special_defense || 0);
    const spe = Number(found.speed || 0);
    const total = Number(found.total || hp + atk + def + spa + spd + spe);

    const embed = new EmbedBuilder()
      .setColor("#00E5FF")
      .setTitle(`#${id} • ${found.name}`)
      .setDescription(`**Type:** ${typeIcons(found.type)} ${found.type}`)
      .addFields(
        { name: "🌍 Spawn Biome", value: biome },
        {
          name: "📊 Base Stats",
          value:
            `HP: ${hp}\n` +
            `Attack: ${atk}\n` +
            `Defense: ${def}\n` +
            `SpA: ${spa}\n` +
            `SpD: ${spd}\n` +
            `Speed: ${spe}\n` +
            `Total: ${total}`
        }
      )
      .setImage(found.sprite)
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
