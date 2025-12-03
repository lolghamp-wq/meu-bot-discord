const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

// 🔥 Seus emojis personalizados DEFINITIVOS
const TYPE_EMOJIS = {
    "lutador": "<:fighting:1445236652434784336>",
    "voador": "<:flying:1445236723981226074>",
    "fogo": "<:fire:1445236710408454346>",
    "água": "<:water:1445238162690408509>",
    "agua": "<:water:1445238162690408509>",
    "planta": "<:grass:1445236750988611655>",
    "inseto": "<:bug:1445236474898288745>",
    "dragão": "<:dragon:1445236597158313984>",
    "dragao": "<:dragon:1445236597158313984>",
    "psíquico": "<:psychic:1445236903350763551>",
    "psiquico": "<:psychic:1445236903350763551>",
    "pedra": "<:rock:1445236925014343901>",
    "terra": "<:ground:1445236765874065631>",
    "gelo": "<:ice:1445236799747391602>",
    "fantasma": "<:ghost:1445236735574540298>",
    "normal": "<:normal:1445236814142115963>",
    "aço": "<:steel:1445236950289219707>",
    "aco": "<:steel:1445236950289219707>",
    "venenoso": "<:poison:1445236883079565413>"
};

function getEmoji(type) {
    if (!type) return "";
    const t = type.trim().toLowerCase();
    return TYPE_EMOJIS[t] || "";
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pokedex")
        .setDescription("Consulta informações de um Pokémon")
        .addIntegerOption(o =>
            o.setName("numero").setDescription("Número da Pokédex")
        )
        .addStringOption(o =>
            o.setName("nome").setDescription("Nome do Pokémon")
        ),

    async execute(interaction) {
        await interaction.deferReply();

        // 🔥 Usa agora pokedex1.1.csv
        const raw = fs.readFileSync("./pokedex1.1.csv", "utf8");
        const linhas = raw.split(/\r?\n/);

        const header = linhas[0].split(",");
        const dexI = header.indexOf("dex_number");
        const nameI = header.indexOf("name");
        const typeI = header.indexOf("type");
        const biomeI = header.indexOf("spawn_biome");

        const numero = interaction.options.getInteger("numero");
        const nomeBusca = interaction.options.getString("nome");

        let found = null;

        for (let i = 1; i < linhas.length; i++) {
            const cols = linhas[i].split(",");

            if (numero !== null && cols[dexI] == numero) {
                found = cols;
                break;
            }

            if (nomeBusca) {
                const nomeCsv = cols[nameI].toLowerCase();
                if (nomeCsv.includes(nomeBusca.toLowerCase())) {
                    found = cols;
                    break;
                }
            }
        }

        if (!found) {
            return interaction.editReply("❌ Pokémon não encontrado.");
        }

        const id = found[dexI];
        const name = found[nameI];
        const type = found[typeI];
        const biome = found[biomeI];

        // 🔥 Suporta tipo1 / tipo2 separados por "|"
        let [t1, t2] = type.split("|").map(t => t.trim());

        const e1 = getEmoji(t1);
        const e2 = getEmoji(t2);

        const sprite =
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

        const embed = new EmbedBuilder()
            .setColor("Aqua")
            .setTitle(`#${id} – ${name}`)
            .setThumbnail(sprite)
            .addFields(
                {
                    name: "Tipo",
                    value: `${e1} ${t1}${t2 ? ` | ${e2} ${t2}` : ""}`
                },
                {
                    name: "Bioma de Spawn",
                    value: biome || "desconhecido"
                }
            )
            .setFooter({ text: "CobbleGhost Pokédex" });

        return interaction.editReply({ embeds: [embed] });
    }
};
