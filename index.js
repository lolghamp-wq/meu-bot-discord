require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const csv = require("csv-parser");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

let pokedex = [];

fs.createReadStream("pokedex.csv")
  .pipe(csv())
  .on("data", (row) => pokedex.push(row))
  .on("end", () => console.log("Pokédex carregada!"));

client.on("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!pkm")) return;

  const query = msg.content.split(" ")[1];
  if (!query) return msg.reply("Digite o nome do Pokémon!");

  const pkm = pokedex.find(p =>
    p.spawn_id?.toLowerCase() === query.toLowerCase() ||
    p.name?.toLowerCase() === query.toLowerCase()
  );

  if (!pkm) return msg.reply("Pokémon não encontrado!");

  try {
    const embed = new EmbedBuilder()
      .setTitle("📘 Dados do Pokémon")
      .addFields(
        { name: "Nome:", value: pkm.name || "???" },
        { name: "N° Pokédex:", value: pkm.dex_number || "???" },
        { name: "Tipo:", value: pkm.type || "???" },
        { name: "Bioma:", value: pkm.spawn_biome || "???" }
      );

    if (pkm.sprite)
      embed.setThumbnail(pkm.sprite);

    await msg.reply({ embeds: [embed] });

  } catch (err) {
    console.log("ERRO AO MANDAR EMBED:", err);
    msg.reply("Erro ao enviar dados!");
  }
});

client.login(process.env.TOKEN);
