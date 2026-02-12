const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");
const spawns = require("../pokemon.json"); // JSON de spawn

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");

// ---------- LER CSV COM FALLBACK ----------
function readRawCSV(p) {
  const raw = fs.readFileSync(p);

  try {
    const s = raw.toString("utf8");
    if (!s.includes("Ã") && !s.includes("�")) return s;
  } catch {}

  try {
    const latin = raw.toString("latin1");
    const maybeUtf = Buffer.from(latin, "latin1").toString("utf8");
    if (!maybeUtf.includes("Ã") && !maybeUtf.includes("�")) return maybeUtf;
  } catch {}

  return raw.toString("utf8");
}

// ---------- PARSE CSV ----------
function parseCSV(text) {
  const linhas = text.split(/\r?\n/).map(l => l.replace(/\r/g,""));
  const headerLineIndex = linhas.findIndex(l => l.trim().length > 0);
  if (headerLineIndex === -1) return [];

  const header = linhas[headerLineIndex].split(";").map(h => h.trim());
  const rows = [];

  for (let i = headerLineIndex + 1; i < linhas.length; i++) {
    const line = linhas[i];
    if (!line || line.trim() === "") continue;

    const cols = line.split(";").map(c => c.trim());
    const obj = {};
    header.forEach((h, idx) => obj[h] = cols[idx] ?? "");
    rows.push(obj);
  }

  return rows;
}

// ---------- NORMALIZAR TEXTO ----------
function normalizeKey(s) {
  if (!s && s !== 0) return "";
  return s.toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------- EMOJIS ----------
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

// ---------- ÍCONES ----------
function iconsFromTypeField(typeField) {
  if (!typeField) return "";

  const parts = typeField.split(/[\/|,]/).map(p => p.trim()).filter(Boolean);
  return parts.map(p => TYPE_EMOJIS[normalizeKey(p)] || "").join(" ");
}

// ---------- BIOMA JSON ----------
function acharBiome(id) {
  const conditions = spawns["minecraft:spawn_rules"].conditions;

  for (const c of conditions) {
    if (!c["minecraft:permute_type"]) continue;

    for (const t of c["minecraft:permute_type"]) {
      if (t.entity_type === `pokemon:p${id}`) {
        if (c["minecraft:biome_filter"]?.value)
          return c["minecraft:biome_filter"].value;

        if (c["minecraft:biome_filter"]?.any_of)
          return c["minecraft:biome_filter"].any_of[0].value;

        return "desconhecido";
      }
    }
  }

  return "não spawna";
}

// ---------- LER CSV ----------
const raw = readRawCSV(CSV_PATH);
const rows = parseCSV(raw);

// ---------- COMANDO ----------
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta um Pokémon")
    .addIntegerOption(o => o.setName("numero").setDescription("Número"))
    .addStringOption(o => o.setName("nome").setDescription("Nome")),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let found = null;

    if (numero) {
      found = rows.find(r => Number(r.dex_number) === numero);
    } else if (nome) {
      found = rows.find(r =>
        (r.name || "").toLowerCase().includes(nome.toLowerCase())
      );
    } else {
      return interaction.editReply("❌ Use numero ou nome.");
    }

    if (!found) return interaction.editReply("❌ Pokémon não encontrado.");

    const dex = found.dex_number;
    const name = found.name;
    const sprite = found.sprite;
    const typeField = found.type;

    const icons = iconsFromTypeField(typeField);
    const biome = acharBiome(dex);

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${dex} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: `${icons} ${typeField}` },
        { name: "Bioma de Spawn", value: biome }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
