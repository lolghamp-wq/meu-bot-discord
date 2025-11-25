const fs = require("fs");
const { parse } = require("csv-parse/sync");

const csvData = fs.readFileSync("./pokedex.csv", "utf8");

const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

function normalize(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const map = new Map();

for (const r of records) {
  map.set(normalize(r.name), r);
}

function responderPokemon(nome) {
  const row = map.get(normalize(nome));

  if (!row) {
    return `⚠️ Pokémon **${nome}** não foi encontrado na tabela.`;
  }

  return (
    `📘 **Dados do Pokémon**\n\n` +
    `**Nome:** ${row.name}\n` +
    `**Nº Pokédex:** ${row.dex_number}\n` +
    `**Tipo:** ${row.types}\n` +
    `**Bioma:** ${row.spawn_biome}\n`
  );
}

module.exports = { responderPokemon };
