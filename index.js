require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { responderPokemon } = require("./pokedex");

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!pkm ")) {
    const nome = message.content.replace("!pkm ", "").trim();

    const resposta = responderPokemon(nome);

    message.reply(resposta);
  }
});

client.login(TOKEN);
