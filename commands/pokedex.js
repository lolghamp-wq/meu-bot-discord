const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// Lê CSV sem parse complicado — seu CSV funciona com UTF-8 normal
function readCSV(path) {
    const raw = fs.readFileSync(path, "utf8");
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

const pokedex = readCSV("./pokedex1.1.csv");

// Emojis
const TYPE_EMOJIS = {
    "grama": "<:grass:1445236750988611655>",
    "venenoso": "<:poison:1445236883079565413>",
    "fogo": "<:fire:1445236710408454346>",
    "água": "<:water:1445238162690408509>",
    "agua": "<:water:1445238162690408509>",
    "inseto": "<:bug:1445236474898288745>",
    "dragão": "<:dragon:1445236597158313984>",
    "dragao": "<:dragon:1445236597158313984>",
    "lutador": "<:fighting:1445236652434784336>",
    "voador": "<:flying:1445236723981226074>",
    "fantasma": "<:ghost:1445236735574540298>",
    "pedra": "<:rock:1445236925014343901>"
};

// pega emojis de "Grama / Venenoso"
function getIcons(typeField) {
    if (!typeField) return "";

    const parts = typeField.split("/").map(t => t.trim().toLowerCase());

    const icons = parts.map(t => TYPE_EMOJIS[t] || "").join(" ");
    return icons;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pokedex")
        .setDescription("Consulta um Pokémon")
        .addIntegerOption(o =>
            o.setName("numero").setDescription("Número da Pokédex"))
        .addStringOption(o =>
            o.setName("nome").setDescription("Nome do Pokémon")),

    async execute(interaction) {
        await interaction.deferReply();

        const numero = interaction.options.getInteger("numero");
        const nome = interaction.options.getString("nome");

        let found = null;

        if (numero) {
            found = pokedex.find(p => Number(p.dex_number) === numero);
        } else if (nome) {
            const n = nome.toLowerCase();
            found = pokedex.find(p => p.name.toLowerCase().includes(n));
        }

        if (!found) {
            return interaction.editReply("❌ Pokémon não encontrado.");
        }

        const icons = getIcons(found.type);

        const embed = new EmbedBuilder()
            .setColor("Aqua")
            .setTitle(`#${found.dex_number} - ${found.name}`)
            .setThumbnail(found.sprite)
            .addFields(
                { name: "Tipo", value: `${icons} ${found.type}` },
                { name: "Bioma de Spawn", value: found.spawn_biome }
            )
            .setFooter({ text: "CobbleGhost Pokédex" });

        await interaction.editReply({ embeds: [embed] });
    }
};
