require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

// Inicializa o bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Carrega comandos da pasta /commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commandsArray = [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commandsArray.push(command.data.toJSON());
}

// Registra slash commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Atualizando comandos...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsArray }
    );
    console.log("✅ Comandos registrados!");
  } catch (error) {
    console.error(error);
  }
})();

// Listener dos comandos
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "❌ Erro ao executar o comando.", ephemeral: true });
  }
});

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

