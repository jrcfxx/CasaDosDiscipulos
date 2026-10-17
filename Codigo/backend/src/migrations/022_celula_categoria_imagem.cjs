/**
 * Adiciona categoria, modalidade e imagem às células
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable("celula", (table) => {
    table.string("categoria", 120).nullable().after("nome");
    table.string("modalidade", 30).nullable().defaultTo("presencial").after("horario_reuniao");
    table.string("imagem_url", 500).nullable().after("modalidade");
    table.string("gd_mae", 100).nullable().after("imagem_url");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("celula", (table) => {
    table.dropColumn("categoria");
    table.dropColumn("modalidade");
    table.dropColumn("imagem_url");
    table.dropColumn("gd_mae");
  });
};
