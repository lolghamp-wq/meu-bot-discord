const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pokedex")
    .setDescription("Consulta informações de um Pokémon")
    .addIntegerOption(option =>
      option.setName("numero")
        .setDescription("Número da Pokédex")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("nome")
        .setDescription("Nome do Pokémon")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const numero = interaction.options.getInteger("numero");
    const nomeBusca = interaction.options.getString("nome");

    // LER CSV EM "latin1" PARA CORRIGIR ACENTOS
    const raw = fs.readFileSync("./pokedex1.0.csv", "latin1");
    const linhas = raw.split(/\r?\n/);

    // Cabeçalho
    const header = linhas[0].split(/,|;|\t/);

    const idxDexNumber = header.indexOf("dex_number");
    const idxName      = header.indexOf("name");
    const idxType      = header.indexOf("type");
    const idxBiome     = header.indexOf("spawn_biome");

    let encontrado = null;

    // ---------- MODO 1: PESQUISA POR NÚMERO ----------
    if (numero !== null) {
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);
        if (cols[idxDexNumber] == numero) {
          encontrado = cols;
          break;
        }
      }

      if (!encontrado) {
        return interaction.editReply("❌ Pokémon não encontrado pelo número.");
      }
    }

    // ---------- MODO 2: PESQUISA POR NOME ----------
    else if (nomeBusca !== null) {
      const nomeLower = nomeBusca.trim().toLowerCase();

      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(/,|;|\t/);

        if (!cols[idxName]) continue;

        const nomeCsv = cols[idxName].trim().toLowerCase();

        if (nomeCsv.includes(nomeLower)) {
          encontrado = cols;
          break;
        }
      }

      if (!encontrado) {
        return interaction.editReply("❌ Pokémon não encontrado pelo nome.");
      }
    } else {
      return interaction.editReply("❌ Você precisa usar **numero** ou **nome**.");
    }

    // ---------- DADOS DO POKÉMON ----------
    const id    = encontrado[idxDexNumber].trim();
    const name  = encontrado[idxName].trim();
    const type  = encontrado[idxType].trim();
    const biome = encontrado[idxBiome].trim();

    // SPRITE DA POKEAPI
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    // ---------- MAPA DE TIPOS COM SEUS EMOJIS ----------
    const emojiType = {
      "Inseto": "<:bug:1445236474898288745>",
      "Sombrio": "<:dark:1445236537677518918>",
      "Dragão": "<:dragon:1445236597158313984>",
      "Elétrico": "<:electric:1445236615407599644>",
      "Fada": "<:fairy:1445236630771339284>",
      "Lutador": "<:fighting:1445236652434784336>",
      "Fogo": "<:fire:1445236710408454346>",
      "Voador": "<:flying:1445236723981226074>",
      "Fantasma": "<:ghost:1445236735574540298>",
      "Planta": "<:grass:1445236750988611655>",
      "Terrestre": "<:ground:1445236765874065631>",
      "Gelo": "<:ice:1445236799747391602>",
      "Normal": "<:normal:1445236814142115963>",
      "Venenoso": "<:poison:1445236883079565413>",
      "Psíquico": "<:psychic:1445236903350763551>",
      "Pedra": "<:rock:1445236925014343901>",
      "Aço": "<:steel:1445236950289219707>",
      "Água": "<:water:1445238162690408509>"
    };

    // transforma "Fogo/Voador" → "<emoji> Fogo | <emoji> Voador"
    const tiposFormatados = type
      .split("/")
      .map(t => `${emojiType[t.trim()] || ""} ${t.trim()}`)
      .join(" | ");

    // ---------- EMBED ----------
    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(`#${id} - ${name}`)
      .setThumbnail(sprite)
      .addFields(
        { name: "Tipo", value: tiposFormatados, inline: false },
        { name: "Bioma de Spawn", value: biome || "Desconhecido", inline: false }
      )
      .setFooter({ text: "CobbleGhost Pokédex" });

    return interaction.editReply({ embeds: [embed] });
  }
};
