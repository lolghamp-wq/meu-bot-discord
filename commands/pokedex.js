const fs = require("fs");
const path = require("path");

const {
SlashCommandBuilder,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require("discord.js");

const CSV_PATH = path.join(__dirname,"..","pokedex1.1.csv");

function normalize(text){

if(!text) return ""

return text.toString()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.toLowerCase()
.trim()

}

function readCSV(){

let raw = fs.readFileSync(CSV_PATH,"utf8")

raw = raw.replace(/^\uFEFF/, "")

const linhas = raw.split("\n").map(l=>l.trim()).filter(Boolean)

const header = linhas[0].split(";").map(h=>normalize(h))

const rows=[]

for(let i=1;i<linhas.length;i++){

const cols = linhas[i].split(";")

const obj={}

header.forEach((h,idx)=>{
obj[h] = cols[idx] || ""
})

rows.push(obj)

}

return rows

}

const pokedex = readCSV()

// ================= ICONES DE TIPO =================

const TYPE_ICONS = {

grass:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/grass.png",
poison:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/poison.png",
fire:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/fire.png",
water:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/water.png",
bug:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/bug.png",
dragon:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/dragon.png",
dark:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/dark.png",
electric:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/electric.png",
fairy:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/fairy.png",
fighting:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/fighting.png",
flying:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/flying.png",
ghost:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/ghost.png",
rock:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/rock.png",
steel:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/steel.png",
ice:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/ice.png",
normal:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/normal.png",
psychic:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/psychic.png",
ground:"https://raw.githubusercontent.com/lolghamp-wq/meu-bot-discord/main/assets/types/ground.png"

}

// ================= ICONES NO TEXTO =================

function iconsFromType(type){

if(!type) return ""

return type
.split(/[\/|,]/)
.map(t=>normalize(t))
.map(key=>TYPE_ICONS[key] ? `[‎](${TYPE_ICONS[key]})` : "")
.join(" ")

}

// ================= BARRA DE STATUS =================

function statBar(value){

const max=255
const size=6

const filled=Math.round((value/max)*size)

let emoji="🟩"

if(value>=150) emoji="🟧"
else if(value>=100) emoji="🟨"
else if(value>=50) emoji="🟩"
else emoji="🟥"

return emoji.repeat(filled)+"⬜".repeat(size-filled)

}

// ================= COMANDO =================

module.exports={

data:new SlashCommandBuilder()
.setName("pokedex")
.setDescription("Consulta um Pokémon")
.addIntegerOption(o=>o.setName("numero").setDescription("Número da Pokédex"))
.addStringOption(o=>o.setName("nome").setDescription("Nome do Pokémon")),

async execute(interaction){

await interaction.deferReply()

const numero=interaction.options.getInteger("numero")
const nome=interaction.options.getString("nome")

let found=null

if(numero){

found=pokedex.find(p=>Number(p.dex_number)===numero)

}else if(nome){

found=pokedex.find(p=>normalize(p.name).includes(normalize(nome)))

}

if(!found){

return interaction.editReply("❌ Pokémon not found.")

}

const id = Number(found.dex_number)

const spriteNormal =
`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

const hp=Number(found.hp||0)
const atk=Number(found.attack||0)
const def=Number(found.defense||0)
const spa=Number(found.special_attack||0)
const spd=Number(found.special_defense||0)
const spe=Number(found.speed||0)

const total=Number(found.total||hp+atk+def+spa+spd+spe)

const biome = found.spawn_biome || "Unknown"

const embed=new EmbedBuilder()

.setColor("#00E5FF")
.setTitle(`📖 #${id} • ${found.name}`)
.setDescription(`**Type:** ${iconsFromType(found.type)} ${found.type}`)

.addFields(

{
name:"🌍 Spawn Biome",
value:`\`${biome}\``
},

{
name:"📊 Base Stats",
value:
"```"+
`HP      ${statBar(hp)} ${hp}

ATK     ${statBar(atk)} ${atk}

DEF     ${statBar(def)} ${def}

SPATK   ${statBar(spa)} ${spa}

SPDEF   ${statBar(spd)} ${spd}

SPEED   ${statBar(spe)} ${spe}

TOTAL   ${total}`
+"```"
}

)

.setImage(spriteNormal)

const row = new ActionRowBuilder()

.addComponents(

new ButtonBuilder()
.setCustomId(`prev_${id}`)
.setLabel("⬅️ Previous")
.setStyle(ButtonStyle.Secondary),

new ButtonBuilder()
.setCustomId(`toggle_${id}`)
.setLabel("✨ Shiny")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`next_${id}`)
.setLabel("➡️ Next")
.setStyle(ButtonStyle.Secondary)

)

await interaction.editReply({
embeds:[embed],
components:[row]
})

}

}
