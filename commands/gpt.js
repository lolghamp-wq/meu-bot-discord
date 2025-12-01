const { SlashCommandBuilder } = require("discord.js");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gpt")
    .setDescription("Converse com o GPT")
    .addStringOption(option =>
      option.setName("mensagem")
        .setDescription("O que deseja perguntar?")
        .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString("mensagem");

    await interaction.deferReply();

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        { role: "system", content: "Você é o bot oficial do servidor CobleGhost." },
        { role: "user", content: question }
      ],
      max_tokens: 300
    });

    await interaction.editReply(completion.choices[0].message.content);
  }
};
