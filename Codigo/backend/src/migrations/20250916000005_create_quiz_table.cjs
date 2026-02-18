/**
 * Migration para criar tabela de quiz
 * Quiz está vinculado a um módulo e contém questões
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("quiz", (table) => {
    table.increments("id_quiz").primary();

    table
      .integer("id_modulo")
      .unsigned()
      .notNullable()
      .references("id_modulo")
      .inTable("modulo")
      .onDelete("CASCADE")
      .comment("Módulo ao qual o quiz pertence");

    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
    table.timestamp("criado_em").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("quiz");
};
