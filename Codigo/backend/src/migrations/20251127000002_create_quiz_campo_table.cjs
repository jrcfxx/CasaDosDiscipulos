/**
 * Migration para criar tabela de campos de quiz
 * Relaciona quizzes com campos personalizados (texto, número, data, link, upload)
 * Define o conteúdo introdutório ou explicativo do quiz
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("quiz_campo", (table) => {
    table.increments("id").primary();

    table
      .integer("id_quiz")
      .unsigned()
      .notNullable()
      .references("id_quiz")
      .inTable("quiz")
      .onDelete("CASCADE");

    table
      .integer("id_campo")
      .unsigned()
      .notNullable()
      .references("id_campo")
      .inTable("campo_personalizado")
      .onDelete("CASCADE")
      .comment("Tipo de campo: texto, numero, data, link, upload");

    table.string("label").notNullable().comment("Título da seção do conteúdo");
    table
      .text("conteudo")
      .notNullable()
      .comment("Conteúdo do quiz para este campo");
    table
      .integer("ordem")
      .unsigned()
      .notNullable()
      .defaultTo(0)
      .comment("Ordem de exibição do conteúdo");

    // Cada campo só pode aparecer uma vez por quiz na mesma ordem
    table.unique(["id_quiz", "ordem"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("quiz_campo");
};
