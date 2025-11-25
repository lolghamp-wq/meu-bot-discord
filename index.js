require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const csv = require("csv-parser");
const express = require("express");

// servidor web para manter o Render ativo
const app = express();
app.get("/", (req, res) => res.send("Bot está rodando!"));
app.listen(3000, () => console.log("Servidor web ativo na porta 3000"));

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
  .on("data", (row) => {
    pokedex.push(row);
  })
  .on("end", () => {
    console.log("Pokédex carregada!");
  });

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!pkm")) return;

  const name = msg.content.split(" ")[1];

  if (!name) return msg.reply("Digite o nome do Pokémon!");

  const pkm = pokedex.find(p =>
    p.spawn_id?.toLowerCase() === name.toLowerCase() ||
    p.name?.toLowerCase() === name.toLowerCase()
  );

  if (!pkm) return msg.reply("Pokemon não encontrado!");

  const sprite = pkm.sprite || null;
  const dex  = pkm.dex_number || "???";
  const type = pkm.types || "???";
  const biome = pkm.spawn_biome || "???";

  try {
    const emb = new EmbedBuilder()
      .setTitle("📘 Dados do Pokémon")
      .addFields(
        { name: "Nome:", value: pkm.name || "???" },
        { name: "N° Pokédex:", value: String(dex) },
        { name: "Tipo:", value: type },
        { name: "Bioma:", value: biome },
      );

    if (sprite)
      emb.setThumbnail(sprite);

    await msg.reply({ embeds: [emb] });

  } catch (e) {
    console.log("ERRO AO ENVIAR:", e);
    msg.reply("Erro ao enviar dados!");
  }
});

client.once("ready", () => {
  console.log("Bot pronto!");
});

client.login(process.env.TOKEN);
