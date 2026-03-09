require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commandsArray = [];

for (const file of commandFiles) {

  const command = require(`./commands/${file}`);

  client.commands.set(command.data.name, command);
  commandsArray.push(command.data.toJSON());

}

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

client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {

      await command.execute(interaction);

    } catch (error) {

      console.error(error);
      await interaction.reply({ content: "❌ Erro ao executar comando.", ephemeral: true });

    }

  }

  // BOTÕES
  if (interaction.isButton()) {

    const [action, id] = interaction.customId.split("_");

    let nextId = Number(id);

    if (action === "next") nextId++;
    if (action === "prev") nextId--;

    // SHINY TOGGLE
    if (action === "toggle") {

      const embed = interaction.message.embeds[0].data;

      const normal =
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

      const shiny =
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;

      let current = embed.image.url;

      let newSprite;
      let newLabel;

      if (current === shiny) {

        newSprite = normal;
        newLabel = "✨ Shiny";

      } else {

        newSprite = shiny;
        newLabel = "🔁 Normal";

      }

      embed.image = { url: newSprite };

      const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
        .setCustomId(`prev_${id}`)
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
        .setCustomId(`toggle_${id}`)
        .setLabel(newLabel)
        .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
        .setCustomId(`next_${id}`)
        .setLabel("➡️ Next")
        .setStyle(ButtonStyle.Secondary)

      );

      return interaction.update({
        embeds:[embed],
        components:[row]
      });

    }

    const command = client.commands.get("pokedex");

    interaction.options = {
      getInteger: () => nextId,
      getString: () => null
    };

    await command.execute(interaction);

  }

});

client.once("ready", () => {

  console.log(`🤖 Bot online como ${client.user.tag}`);

});

client.login(process.env.DISCORD_TOKEN);
