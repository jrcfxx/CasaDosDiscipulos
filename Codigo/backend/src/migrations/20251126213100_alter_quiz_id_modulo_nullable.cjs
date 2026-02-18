/**
 * Migration para tornar id_modulo nullable na tabela quiz
 * Permite criar quiz sem vínculo inicial, vinculação feita via modulo_quiz
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("quiz", (table) => {
    table.integer("id_modulo").unsigned().nullable().alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("quiz", (table) => {
    table.integer("id_modulo").unsigned().notNullable().alter();
  });
};
