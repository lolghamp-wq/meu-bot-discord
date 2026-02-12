const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");
const SPAWN_JSON_PATH = path.join(__dirname, "..", "pokemon.json");

// ---------------- CSV ----------------
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

// ---------------- SPAWN JSON ----------------
const spawnData = JSON.parse(fs.readFileSync(SPAWN_JSON_PATH, "utf8"));

function extractBiome(filter) {
  if (!filter) return null;

  if (filter.value) return filter.value;

  if (filter.any_of) {
    return filter.any_of.map(f => extractBiome(f)).filter(Boolean).join(", ");
  }

  if (filter.all_of) {
    return filter.all_of.map(f => extractBiome(f)).filter(Boolean).join(" + ");
  }

  return null;
}

function acharBiome(id) {
  const conditions = spawnData["minecraft:spawn_rules"].conditions;

  for (const c of conditions) {
    const tipos = c["minecraft:permute_type"];
    if (!tipos) continue;

    for (const t of tipos) {
      if (t.entity_type === `pokemon:p${id}`) {
        return extractBiome(c["minecraft:biome_filter"]);
      }
    }
  }

  return null;
}

// ---------------- EMOJIS ----------------
const TYPE_EMOJIS = {
  "grama": "<:grass:1445236750988611655>",
  "venenoso": "<:poison:1445236883079565413>",
  "fogo": "<:fire:1445236710408454346>",
  "agua": "<:water:1445238162690408509>",
  "inseto": "<:bug:1445236474898288745>",
  "dragao": "<:dragon:1445236597158313984>",
  "sombrio": "<:dark:1445236564429901935>",
  "eletrico": "<:electric:1445236615407599644>",
  "fada": "<:fairy:1445236630771339284>",
  "lutador": "<:fighting:1445236652434784336>",
  "voador": "<:flying:1445236723981226074>",
  "fantasma": "<:ghost:1445236735574540298>",
  "pedra": "<:rock:1445236925014343901>",
  "aco": "<:steel:1445236950289219707>",
  "gelo": "<:ice:1445236799747391602>",
  "normal": "<:normal:1445236814142115963>",
  "psiquico": "<:psychic:1445236903350763551>",
  "terrestre": "<:ground:1445236765874065631>"
};

function normalize(s) {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTypeIcons(typeField) {
  if (!typeField) return "";

  return typeField
    .split(/[\/|,]/)
    .map(t => TYPE_EMOJIS[normalize(t.trim())] || "")
    .join(" ");
}

// ---------------- COMMAND ----------------
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta um Pokémon")
    .addIntegerOption(o => o.setName("numero").setDescription("Número da Pokédex"))
    .addStringOption(o => o.setName("nome").setDescription("Nome do Pokémon")),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let found;

    if (numero) {
      found = pokedex.find(p => Number(p.dex_number) === numero);
    } else if (nome) {
      found = pokedex.find(p => p.name.toLowerCase().includes(nome.toLowerCase()));
    } else {
      return interaction.editReply("❌ Use número ou nome.");
    }

    if (!found) return interaction.editReply("❌ Pokémon não encontrado.");

    const biome = acharBiome(found.dex_number) || "não spawna";

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${found.dex_number} - ${found.name}`)
      .setThumbnail(found.sprite)
      .addFields(
        { name: "Tipo", value: `${getTypeIcons(found.type)} ${found.type}` },
        { name: "Bioma de Spawn", value: biome }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
