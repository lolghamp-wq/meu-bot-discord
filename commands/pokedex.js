const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta um Pokémon")
    .addIntegerOption(opt =>
      opt.setName("numero")
      .setDescription("Número da Pokédex")
      .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // Lê o CSV exatamente como o bot antigo fazia
    const raw = fs.readFileSync("./pokedex1.1.csv", "utf8")
      .replace(/\r/g, ""); 

    const lines = raw.split("\n");
    const header = lines[0].split(";");

    // Índices das colunas
    const IDX_SPRITE = header.indexOf("sprite");
    const IDX_NUM = header.indexOf("nº");
    const IDX_SPAWN = header.indexOf("spawn_biome");
    const IDX_DEX = header.indexOf("dex_number");
    const IDX_NAMETYPE = header.indexOf("name:type");

    const numero = interaction.options.getInteger("numero");

    let found = null;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";");

      const dexNumber = Number(cols[IDX_DEX]);

      if (dexNumber === numero) {
        found = cols;
        break;
      }
    }

    if (!found) {
      return interaction.editReply("❌ Pokémon não encontrado.");
    }

    // Dados do Pokémon
    const sprite = found[IDX_SPRITE];
    const spawn = found[IDX_SPAWN];
    const nomeTipo = found[IDX_NAMETYPE];

    const [name, type1raw, type2raw] = nomeTipo.split("/");

    // Emojis → EXATAMENTE os que você usava!
    const TYPE = {
      "Lutador": "<:fighting:1445236652434784336>",
      "Voador": "<:flying:1445236723981226074>",
      "Dragão": "<:dragon:1445236597158313984>",
      "Fogo": "<:fire:1445236710408454346>",
      "Água": "<:water:1445238162690408509>",
      "Planta": "<:grass:1445236750988611655>",
      "Normal": "<:normal:1445236814142115963>",
      "Elétrico": "<:electric:1445236615407599644>",
      "Sombrio": "<:dark:1445236564429901935>",
      "Terrestre": "<:ground:1445236765874065631>",
      "Gelo": "<:ice:1445236799747391602>",
      "Pedra": "<:rock:1445236925014343901>",
      "Veneno": "<:poison:1445236883079565413>",
      "Fantasma": "<:ghost:1445236735574540298>",
      "Psíquico": "<:psychic:1445236903350763551>",
      "Inseto": "<:bug:1445236474898288745>",
      "Aço": "<:steel:1445236950289219707>",
      "Fada": "<:fairy:1445236630771339284>"
    };

    const type1 = TYPE[type1raw.trim()] || type1raw;
    const type2 = type2raw ? TYPE[type2raw.trim()] || type2raw : null;

    const embed = new EmbedBuilder()
      .setColor("#00ffee")
      .setTitle(`#${numero} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        {
          name: "Tipo",
          value: type2 ?
            `${type1} ${type1raw} | ${type2} ${type2raw}` :
            `${type1} ${type1raw}`
        },
        {
          name: "Bioma de Spawn",
          value: spawn || "não spawna"
        }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    interaction.editReply({ embeds: [embed] });
  }
};
