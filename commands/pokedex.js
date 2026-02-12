const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");

const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");
const SPAWN_JSON = require("../pokemon.json");

// ---------- CSV ----------
function readCSV() {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const linhas = raw.split("\n").map(l => l.trim()).filter(Boolean);

  const header = linhas[0].split(";");
  const rows = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(";");
    const obj = {};
    header.forEach((h, idx) => obj[h] = cols[idx]);
    rows.push(obj);
  }

  return rows;
}

const pokedex = readCSV();

// ---------- JSON SPAWN ----------
function acharBiome(id) {
  const conds = SPAWN_JSON["minecraft:spawn_rules"].conditions;

  for (const c of conds) {
    if (!c["minecraft:permute_type"]) continue;

    for (const t of c["minecraft:permute_type"]) {
      if (!t.entity_type) continue;

      if (t.entity_type === `pokemon:p${id}`) {

        const bf = c["minecraft:biome_filter"];

        if (!bf) return "não spawna";

        if (bf.value) return bf.value;

        if (bf.any_of) {
          const nomes = [];

          for (const a of bf.any_of) {
            if (a.value) nomes.push(a.value);

            if (a.all_of) {
              for (const b of a.all_of) {
                if (b.value) nomes.push(b.value);
              }
            }
          }

          return nomes.join(" / ");
        }

        return "desconhecido";
      }
    }
  }

  return "não spawna";
}

// ---------- COMANDO ----------
module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta Pokémon")
    .addIntegerOption(o => o.setName("numero").setDescription("Número"))
    .addStringOption(o => o.setName("nome").setDescription("Nome")),

  async execute(interaction) {
    const numero = interaction.options.getInteger("numero");
    const nome = interaction.options.getString("nome");

    let poke;

    if (numero) {
      poke = pokedex.find(p => Number(p.dex_number) === numero);
    } else if (nome) {
      poke = pokedex.find(p => p.name.toLowerCase().includes(nome.toLowerCase()));
    }

    if (!poke) return interaction.reply("❌ Pokémon não encontrado.");

    const biome = acharBiome(poke.dex_number);

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${poke.dex_number} - ${poke.name}`)
      .setThumbnail(poke.sprite)
      .addFields(
        { name: "Tipo", value: poke.type || "-" },
        { name: "Bioma de Spawn", value: biome }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    interaction.reply({ embeds: [embed] });
  }
};
