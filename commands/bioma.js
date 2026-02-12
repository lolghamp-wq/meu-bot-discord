const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const spawns = require("../pokemon.json");

// ---------- CSV ----------
function readCSV() {
    const raw = fs.readFileSync("./pokedex1.1.csv", "utf8");
    const linhas = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const header = linhas[0].split(";").map(h => h.trim());
    const rows = [];

    for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(";").map(c => c.trim());
        const obj = {};
        header.forEach((h, idx) => obj[h] = cols[idx]);
        rows.push(obj);
    }

    return rows;
}

const pokedex = readCSV();

// ---------- JSON SPAWN ----------
function acharBiome(id) {
    const conditions = spawns["minecraft:spawn_rules"].conditions;

    for (const c of conditions) {
        if (!c["minecraft:permute_type"]) continue;

        for (const t of c["minecraft:permute_type"]) {
            if (!t.entity_type) continue;

            if (t.entity_type === `pokemon:p${id}`) {
                if (c["minecraft:biome_filter"]?.value)
                    return c["minecraft:biome_filter"].value;

                if (c["minecraft:biome_filter"]?.any_of)
                    return c["minecraft:biome_filter"].any_of[0].value;

                return "desconhecido";
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
        const biomeInput = interaction.options.getString("nome").toLowerCase();

        const results = [];

        for (const p of pokedex) {
            const id = p.dex_number;
            const biome = acharBiome(id);

            if (biome && biome.toLowerCase().includes(biomeInput)) {
                results.push(`#${id} - ${p.name}`);
            }
        }

        if (results.length === 0) {
            return interaction.reply(`❌ Nenhum Pokémon encontrado no bioma **${biomeInput}**`);
        }

        let list = results.join("\n");
        if (list.length > 3900)
            list = list.slice(0, 3900) + "\n... + mais resultados";

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle(`📍 Pokémon que spawnam em: ${biomeInput}`)
            .setDescription(list)
            .setFooter({ text: `Encontrados: ${results.length}` });

        await interaction.reply({ embeds: [embed] });
    }
};
