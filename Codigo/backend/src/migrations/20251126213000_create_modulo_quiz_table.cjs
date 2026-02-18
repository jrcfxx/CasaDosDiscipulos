/**
 * Migration para criar tabela de junção modulo_quiz
 * Permite relacionamento N:N - um quiz pode estar em vários módulos
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("modulo_quiz", (table) => {
    table.increments("id").primary();

    table
      .integer("id_modulo")
      .unsigned()
      .notNullable()
      .references("id_modulo")
      .inTable("modulo")
      .onDelete("CASCADE");

    table
      .integer("id_quiz")
      .unsigned()
      .notNullable()
      .references("id_quiz")
      .inTable("quiz")
      .onDelete("CASCADE");

    table.timestamp("vinculado_em").defaultTo(knex.fn.now());

    // Garante que um quiz não seja vinculado duas vezes ao mesmo módulo
    table.unique(["id_modulo", "id_quiz"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("modulo_quiz");
};
