const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const JSON_PATH = path.join(__dirname, "..", "pokemon.json");
const CSV_PATH = path.join(__dirname, "..", "pokedex1.1.csv");

const spawns = require(JSON_PATH);

// ---------- CSV ----------
function readCSV() {
    const raw = fs.readFileSync(CSV_PATH, "utf8");
    const linhas = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);

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

// ---------- JSON SPAWN (VERSÃO CORRETA) ----------
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

                if (biomes.length === 0) return null;

                return [...new Set(biomes)];
            }
        }
    }

    return null;
}

// ---------- COMANDO ----------
module.exports = {
    data: new SlashCommandBuilder()
        .setName("bioma")
        .setDescription("Lista Pokémon que spawnam em um bioma")
        .addStringOption(opt =>
            opt.setName("nome")
                .setDescription("Nome do bioma")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const biomeInput = interaction.options
            .getString("nome")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const results = [];

        for (const p of pokedex) {
            const id = p.dex_number;
            const biomes = acharBiome(id);

            if (!biomes) continue;

            for (let biome of biomes) {
                biome = biome
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                if (biome.includes(biomeInput)) {
                    results.push(`#${id} - ${p.name}`);
                    break;
                }
            }
        }

        if (results.length === 0) {
            return interaction.editReply(
                `❌ Nenhum Pokémon encontrado no bioma **${biomeInput}**`
            );
        }

        let list = results.join("\n");

        if (list.length > 3900) {
            list = list.slice(0, 3900) + "\n... + mais resultados";
        }

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle(`📍 Pokémon que spawnam em: ${biomeInput}`)
            .setDescription(list)
            .setFooter({ text: `Encontrados: ${results.length}` });

        await interaction.editReply({ embeds: [embed] });
    }
};
