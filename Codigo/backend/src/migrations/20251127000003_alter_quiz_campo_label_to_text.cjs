/**
 * Migration para alterar o tipo da coluna label de quiz_campo para TEXT
 * Permite armazenar perguntas/títulos mais longos
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("quiz_campo", (table) => {
    table.text("label").notNullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("quiz_campo", (table) => {
    table.string("label").notNullable().alter();
  });
};
