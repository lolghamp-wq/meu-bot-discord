const fs = require("fs");
const { parse } = require("csv-parse/sync");

const csvData = fs.readFileSync("./pokedex.csv", "utf8");

const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true,
});

function normalize(texto) {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const map = new Map();

for (const r of records) {
  map.set(normalize(r.nome), r);
}

function responderPokemon(nome) {
  const row = map.get(normalize(nome));

  if (!row) {
    return `⚠️ Pokémon **${nome}** não foi encontrado na tabela.`;
  }

  return (
    `📘 **Dados do Pokémon**\n\n` +
    `**Nome:** ${row.nome}\n` +
    `**Nº Pokédex:** ${row.numero}\n` +
    `**Tipo:** ${row.tipo}\n` +
    `**Bioma:** ${row.bioma}\n`
  );
}

module.exports = { responderPokemon };
