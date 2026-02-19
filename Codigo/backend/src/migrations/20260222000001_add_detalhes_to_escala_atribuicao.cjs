/**
 * Adiciona coluna detalhes à escala_atribuicao
 * Armazena informações específicas por ministério (instrumento, músicas, função, etc.)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("escala_atribuicao", (table) => {
    table.text("detalhes").nullable().comment("JSON: campos específicos do ministério");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("escala_atribuicao", (table) => {
    table.dropColumn("detalhes");
  });
};
