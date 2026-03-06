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

// Listener de interações
client.on("interactionCreate", async interaction => {

  // ================= SLASH COMMAND =================
  if (interaction.isChatInputCommand()) {

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Erro ao executar o comando.",
        ephemeral: true
      });
    }

  }

  // ================= BOTÕES =================
  if (interaction.isButton()) {

    const [action,id] = interaction.customId.split("_")

    let nextId = Number(id)

    if(action === "next") nextId++
    if(action === "prev") nextId--

    // botão shiny
    if(action === "shiny"){

      const sprite =
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`

      const embed = interaction.message.embeds[0].data
      embed.image = { url: sprite }

      return interaction.update({embeds:[embed]})
    }

    const command = client.commands.get("pokedex")

    interaction.options = {
      getInteger: () => nextId,
      getString: () => null
    }

    await command.execute(interaction)

  }

});

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
