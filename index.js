const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let pokedex = [];

fs.createReadStream("./pokedex.csv")
  .pipe(csv())
  .on("data", row => {
    pokedex.push({
      name: row.name,
      dex_number: row.dex_number,
      type: row.type,
      spawn_biome: row.spawn_biome,
      sprite: row.sprite
    });
  })
  .on("end", () => {
    console.log("CSV carregado!");
  });

client.once("ready", () => {
  console.log(`Bot logado como: ${client.user.tag}`);
});


client.on("messageCreate", async (message) => {

  if (!message.content.startsWith("!pkm")) return;

  try {

    const args = message.content.split(" ");
    const nome = args[1]?.toLowerCase();

    if(!nome) return message.reply("Digite: `!pkm nome`");

    const pokemon = pokedex.find(
      p => p.name.toLowerCase() === nome
    );

    if(!pokemon)
      return message.reply("Pokémon não encontrado!");

    
    const embed = new EmbedBuilder()
      .setTitle("📘 Dados do Pokémon")
      .addFields(
        { name: "Nome", value: pokemon.name },
        { name: "Nº Pokédex", value: `${pokemon.dex_number}` },
        { name: "Tipo", value: pokemon.type },
        { name: "Bioma", value: pokemon.spawn_biome }
      );

    if (pokemon.sprite && pokemon.sprite.trim() !== "") {
      embed.setImage(pokemon.sprite);
    }

    await message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    message.reply("Erro ao enviar dados!");
  }

});


client.login(process.env.TOKEN);
