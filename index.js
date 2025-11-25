import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import csv from "csv-parser";

dotenv.config();

// === LOAD CSV ===

let pokedex = [];

fs.createReadStream("pokedex.csv")
  .pipe(csv())
  .on("data", (row) => {
    pokedex.push(row);
  })
  .on("end", () => {
    console.log(`Pokedex carregada (${pokedex.length} registros).`);
  });

// === DISCORD BOT ===

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("clientReady", () => {
  console.log(`Bot iniciado como ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {

  if (!msg.content.startsWith("!pkm")) return;

  const args = msg.content.split(" ");
  const name = args[1];

  if (!name) {
    return msg.reply("⚠️ Use: **!pkm nome**");
  }

  const data = pokedex.find(
    p =>
      p.name.toLowerCase() === name.toLowerCase() ||
      p.spawn_id.toLowerCase() === name.toLowerCase()
  );

  if (!data) {
    return msg.reply("❌ Pokémon não encontrado nessa tabela!");
  }

  try {
    await msg.channel.send({
      embeds: [{
        title: "📘 Dados do Pokémon",
        description: "",
        color: 0x2ECC71,
        image: { url: data.sprite },
        fields: [
          { name: "Nome:", value: data.name, inline: true },
          { name: "Nº Pokédex:", value: data.dex_number, inline: true },
          { name: "Tipo:", value: data.poke_type, inline: true },
          { name: "Bioma:", value: data.spawn_biome || "—", inline: true },
        ]
      }]
    });

  } catch (err) {
    console.log("ERRO AO ENVIAR:", err);
    msg.reply("Erro ao enviar dados!");
  }
});

client.login(process.env.TOKEN);
