// commands/pokedex.js
const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv"); // ajuste se necessário

// tenta ler CSV com fallback de encodings
function readRawCSV(path) {
  let raw = fs.readFileSync(path);
  // tenta UTF-8 direto
  try {
    const s = raw.toString("utf8");
    // se não tem sintomas de mojibake, devolve
    if (!s.includes("Ã") && !s.includes("�")) return s;
  } catch (e) {}
  // tenta latin1 -> utf8
  try {
    const latin = raw.toString("latin1");
    const maybeUtf = Buffer.from(latin, "latin1").toString("utf8");
    if (!maybeUtf.includes("Ã") && !maybeUtf.includes("�")) return maybeUtf;
  } catch (e) {}
  // fallback: interpretar como binary -> utf8
  try {
    const bin = Buffer.from(raw, "binary").toString("utf8");
    return bin;
  } catch (e) {}
  // último recurso: utf8 mesmo
  return raw.toString("utf8");
}

// parse CSV simples com ; como separador
function parseCSV(text) {
  const linhas = text.split(/\r?\n/).map(l => l.replace(/\r/g,""));
  if (linhas.length === 0) return [];
  // identifica header (primeira linha não vazia)
  let headerLineIndex = linhas.findIndex(l => l.trim().length > 0);
  if (headerLineIndex === -1) return [];
  const header = linhas[headerLineIndex].split(";").map(h => h.trim());
  const rows = [];
  for (let i = headerLineIndex + 1; i < linhas.length; i++) {
    const line = linhas[i];
    if (!line || line.trim() === "") continue;
    const cols = line.split(";").map(c => c.trim());
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = (cols[idx] === undefined) ? "" : cols[idx];
    });
    rows.push(obj);
  }
  return rows;
}

// normaliza texto: trim, toLowerCase, remove acentos, remove chars invisíveis
function normalizeKey(s) {
  if (!s && s !== 0) return "";
  let t = s.toString().trim().toLowerCase();
  // remove BOM se tiver
  t = t.replace(/^\uFEFF/, "");
  // remove caracteres de controle/invisíveis
  t = t.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  // normaliza e remove diacríticos
  t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // remove espaços duplicados
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// mapa de emojis (amplie conforme precisar)
const TYPE_EMOJIS = {
  "grama": "<:grass:1445236750988611655>",
  "venenoso": "<:poison:1445236883079565413>",
  "fogo": "<:fire:1445236710408454346>",
  "agua": "<:water:1445238162690408509>",
  "agua": "<:water:1445238162690408509>",
  "inseto": "<:bug:1445236474898288745>",
  "bug": "<:bug:1445236474898288745>",
  "dragao": "<:dragon:1445236597158313984>",
  "sombrio": "<:dark:1445236564429901935>",
  "dark": "<:dark:1445236564429901935>",
  "eletrico": "<:electric:1445236615407599644>",
  "eletrico2": "<:electric:1445236615407599644>",
  "fada": "<:fairy:1445236630771339284>",
  "lutador": "<:fighting:1445236652434784336>",
  "voador": "<:flying:1445236723981226074>",
  "fantasma": "<:ghost:1445236735574540298>",
  "pedra": "<:rock:1445236925014343901>",
  "rocha": "<:rock:1445236925014343901>",
  "aco": "<:steel:1445236950289219707>",
  "ice": "<:ice:1445236799747391602>",
  "gelo": "<:ice:1445236799747391602>",
  "normal": "<:normal:1445236814142115963>",
  "psiquico": "<:psychic:1445236903350763551>",
  "terrestre": "<:ground:1445236765874065631>",
  "ground": "<:ground:1445236765874065631>",
  // adicione mais se precisar
};

// função que pega os emojis a partir do campo type, que pode ter " / " ou "|"
function iconsFromTypeField(typeField) {
  if (!typeField) return "";
  // divide por / , | ou ,
  const parts = typeField.split(/[\/|,]/).map(p => p.trim()).filter(Boolean);
  const icons = [];
  for (const p of parts) {
    const key = normalizeKey(p);
    // mapear variações: elétrico -> eletrico, etc
    let emoji = TYPE_EMOJIS[key];
    if (!emoji) {
      // se chave vazia, tenta remover acentos e espaços (já normalizamos)
      emoji = TYPE_EMOJIS[key.replace(/\s+/g,"")];
    }
    if (emoji) icons.push(emoji);
    else {
      // log para você saber qual tipo faltou mapear
      console.log("[POKEDEX] Tipo não mapeado:", p, "-> key:", key);
    }
  }
  return icons.join(" ");
}

// lê e parseia
const raw = readRawCSV(CSV_PATH);
const rows = parseCSV(raw);

// exporta comando
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

    let found = null;
    if (numero) {
      found = rows.find(r => {
        const val = r["dex_number"] || r["nº"] || r["n"] || r["numero"] || r["nr"];
        if (!val) return false;
        return Number(val.toString().replace(",",".").replace(/\s+/g,"")) === Number(numero);
      });
    } else if (nome) {
      const n = nome.toLowerCase();
      found = rows.find(r => {
        const nm = (r["name"] || r["Name"] || r["nome"] || r["Nome"] || "").toString().toLowerCase();
        return nm && nm.includes(n);
      });
    } else {
      return interaction.editReply("❌ Use `numero` ou `nome`.");
    }

    if (!found) return interaction.editReply("❌ Pokémon não encontrado.");

    const sprite = found["sprite"] || found["Sprites"] || found["image"] || found["foto"] || "";
    const dex = found["dex_number"] || found["nº"] || found["n"] || "";
    const name = found["name"] || found["Name"] || found["nome"] || found["Nome"] || "";
    const typeField = found["type"] || found["Type"] || "";

    const icons = iconsFromTypeField(typeField);

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${dex} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: `${icons} ${typeField || "-"}` },
        { name: "Bioma de Spawn", value: (found["spawn_biome"] || found["bioma"] || found["spawn"] || "-") }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    await interaction.editReply({ embeds: [embed] });
  }
};
