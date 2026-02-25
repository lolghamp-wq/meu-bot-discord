const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");
const JSON_PATH = path.join(__dirname, "..", "pokemon.json");

// ================= NORMALIZAÇÃO =================
function normalizeText(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ================= LEITURA CSV (ANTI COLUNA VAZIA) =================
function readCSV() {
  let raw = fs.readFileSync(CSV_PATH, "utf8");
  raw = raw.replace(/^\uFEFF/, "");

  const linhas = raw.split("\n").map(l => l.trim()).filter(Boolean);

  const rawHeader = linhas[0].split(";");

  const rows = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(";");

    const obj = {};

    for (let j = 0; j < rawHeader.length; j++) {
      let key = normalizeText(rawHeader[j]);

      // Ignora coluna vazia
      if (!key) continue;

      // Corrige nÂº bugado
      if (key === "nº" || key === "nÂº") {
        key = "dex_number";
      }

      obj[key] = cols[j]?.trim() || "";
    }

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
        if (biomes.length === 0) return "Unknown";
        return [...new Set(biomes)].join(" OR ");
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

const TYPE_COLORS = {
  fire: "#FF6A00",
  water: "#0099FF",
  grass: "#00C853",
  electric: "#FFD600",
  fighting: "#D32F2F",
  dragon: "#7C4DFF",
  ice: "#00E5FF",
  normal: "#BDBDBD",
  dark: "#424242",
  fairy: "#FF80AB",
  psychic: "#E040FB",
  ground: "#8D6E63",
  rock: "#795548",
  steel: "#90A4AE",
  poison: "#AA00FF",
  ghost: "#5C6BC0",
  flying: "#81D4FA",
  bug: "#AEEA00"
};

function iconsFromType(type) {
  if (!type) return "";

  return type
    .split(/[\/|,]/)
    .map(t => normalizeText(t))
    .map(key => TYPE_EMOJIS[key] || "")
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

    const numero = interaction.options.getInteger("number");
    const nome = interaction.options.getString("name");

    let found = null;

    if (numero) {
      found = pokedex.find(p =>
        Number(p.dex_number) == numero
      );
    } else if (nome) {
      found = pokedex.find(p =>
        normalizeText(p.name).includes(normalizeText(nome))
      );
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon not found.");
    }

    const id = found.dex_number;
    const biome = acharBiome(id);
    const icons = iconsFromType(found.type);

    const mainType = normalizeText(found.type.split(/[\/|,]/)[0]);
    const embedColor = TYPE_COLORS[mainType] || "#00E5FF";

    const hp  = Number(found.hp ?? found.HP ?? 0);
    const atk = Number(found.attack ?? 0);
    const def = Number(found.defense ?? 0);
    const spa = Number(found.special_attack ?? 0);
    const spd = Number(found.special_defense ?? 0);
    const spe = Number(found.speed ?? 0);
    const total = Number(found.total ?? (hp + atk + def + spa + spd + spe));

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`📖 #${id} • ${found.name}`)
      .setDescription(`**Type:** ${icons} ${found.type}`)
      .addFields(
        { name: "🌍 Spawn Biome", value: `\`${biome}\`` },
        {
          name: "📊 Base Stats",
          value:
            `HP: **${hp}**\n` +
            `Attack: **${atk}**\n` +
            `Defense: **${def}**\n` +
            `Sp. Atk: **${spa}**\n` +
            `Sp. Def: **${spd}**\n` +
            `Speed: **${spe}**\n` +
            `Total: **${total}**`
        }
      )
      .setImage(found.sprite)
      .setFooter({
        text: "CobbleGhost Pokédex • Official System",
        iconURL: found.sprite
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
