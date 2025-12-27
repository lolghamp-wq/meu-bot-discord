const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bioma")
        .setDescription("Lista Pokémon que spawnam em um bioma")
        .addStringOption(opt =>
            opt.setName("nome")
            .setDescription("Nome do bioma (ex: forest, desert, mesa)")
            .setRequired(true)
        ),

    async execute(interaction) {
        const biomeInput = interaction.options.getString("nome").toLowerCase();

        const results = pokedex.filter(p =>
            p.spawn_biome &&
            p.spawn_biome.toLowerCase().includes(biomeInput)
        );

        if (results.length === 0) {
            return interaction.reply(`❌ Nenhum Pokémon encontrado no bioma **${biomeInput}**`);
        }

        let list = results
            .map(p => `#${p.dex_number} - ${p.name}`)
            .join("\n");

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
