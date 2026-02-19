/**
 * Adiciona coluna obrigatorio à tabela modulo
 * obrigatorio=true: segue sequência e conta para nivel_escola
 * obrigatorio=false: módulo livre/opcional, não bloqueia e não conta para nível
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("modulo", (table) => {
    table.boolean("obrigatorio").defaultTo(true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("modulo", (table) => {
    table.dropColumn("obrigatorio");
  });
};
