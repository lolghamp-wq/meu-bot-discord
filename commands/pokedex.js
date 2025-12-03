// commands/pokedex.js
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CSV_PATH = "./pokedex1.0.csv"; // ajuste se o nome/caminho for diferente

// --- Função para ler CSV com fallback de encoding ---
function readCsvWithFallback(path) {
  // tenta utf8 primeiro
  let raw = fs.readFileSync(path, "utf8");
  // Se houver sinais de "mojibake" (como "Ã£" etc) usa latin1 -> utf8
  if (raw.includes("Ã") || raw.includes("�")) {
    raw = fs.readFileSync(path, "latin1"); // lê em latin1
    // já em JS string latin1 normalmente funciona — csv-parse consegue parsear
  }
  return raw;
}

// --- Mapeamento dos emojis que você mandou ---
// Usei os IDs que você enviou em mensagens. Se um ID estiver errado, substitua pelo correto.
// As chaves cobrem nomes em PT e variantes (normal, Fogo, Água, etc).
const TYPE_EMOJIS = {
  // ids extraídos das suas mensagens:
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

// também mapeia nomes em português (se no CSV estiver "Dragão", "Voador", etc)
const PT_TO_KEY = {
  "inseto": "bug",
  "bug": "bug",
  "dragão": "dragon",
  "dragao": "dragon",
  "dark": "dark",
  "sombrio": "dark",
  "elétrico": "electric",
  "eletrico": "electric",
  "fada": "fairy",
  "lutador": "fighting",
  "lutadora": "fighting",
  "fighting": "fighting",
  "fogo": "fire",
  "fire": "fire",
  "voador": "flying",
  "flying": "flying",
  "fantasma": "ghost",
  "ghost": "ghost",
  "planta": "grass",
  "grassa": "grass",
  "grass": "grass",
  "terrestre": "ground",
  "ground": "ground",
  "gelo": "ice",
  "ice": "ice",
  "normal": "normal",
  "venenoso": "poison",
  "poison": "poison",
  "psíquico": "psychic",
  "psiquico": "psychic",
  "psychic": "psychic",
  "pedra": "rock",
  "rock": "rock",
  "aço": "steel",
  "aco": "steel",
  "steel": "steel",
  "água": "water",
  "agua": "water",
  "water": "water"
};

// --- Lê e parseia o CSV ---
const rawCsv = readCsvWithFallback(CSV_PATH);
const rows = parse(rawCsv, {
  columns: true,
  skip_empty_lines: true,
});

// --- Helper para pegar emoji a partir do texto do CSV ---
function emojiFor(typeText) {
  if (!typeText) return "";
  const key = typeText
    .trim()
    .toLowerCase()
    .normalize("NFD") // remove acentos para mapear
    .replace(/[\u0300-\u036f]/g, "");
  const mapped = PT_TO_KEY[key] || key; // tenta traduzir pt -> key
  return TYPE_EMOJIS[mapped] || ""; // retorna emoji ou vazio
}

// --- Comando (Slash) ---
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon")
    .addIntegerOption(option =>
      option.setName("numero").setDescription("Número da Pokédex").setRequired(false)
    )
    .addStringOption(option =>
      option.setName("nome").setDescription("Nome do Pokémon").setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let found = null;

    if (numero != null) {
      found = rows.find(r => {
        // tenta diversas chaves possíveis no CSV
        const v = r.dex_number || r.id || r.ID || r.DEX || r["dex_number"];
        return v && Number(v) === Number(numero);
      });
    } else if (nome) {
      const lower = nome.trim().toLowerCase();
      found = rows.find(r => {
        const n = (r.name || r.nome || r.Name || "").toString().trim().toLowerCase();
        return n && n.includes(lower);
      });
    } else {
      return interaction.editReply("❌ Use `numero` ou `nome`.");
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    // tenta várias colunas possíveis
    const id = (found.dex_number || found.id || found.ID || found["dex_number"])?.toString().trim();
    const name = (found.name || found.nome || found.Name || "").toString().trim();
    // Colunas de tipo: pode ser "type" com "Fogo|Voador", ou "type1"/"type2"
    let typeText = found.type || found.Type || "";
    let type1 = (found.type1 || found.type_1 || "").toString().trim();
    let type2 = (found.type2 || found.type_2 || "").toString().trim();

    if (!type1 && typeText) {
      // se tem um campo "type" com separador "|" ou "," ou "/"
      const parts = typeText.split(/[,|\/]/).map(s => s.trim()).filter(Boolean);
      type1 = parts[0] || "";
      type2 = parts[1] || "";
    }

    const icon1 = emojiFor(type1);
    const icon2 = emojiFor(type2);

    const sprite = found.sprite || found.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: `${icon1 ? icon1 + " " : ""}${type1 || ""}${type2 ? ` | ${icon2 ? icon2 + " " : ""}${type2}` : ""}`, inline: true },
        { name: "Bioma de Spawn", value: (found.spawn_biome || found.bioma || found.spawn || found["spawn_biome"] || "Desconhecido").toString(), inline: true }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
