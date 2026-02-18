/**
 * Migration para criar tabela de campos de módulo
 * Relaciona módulos com campos personalizados (texto, número, data, link, upload)
 * Define o conteúdo introdutório ou explicativo do módulo
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("modulo_campo", (table) => {
    table.increments("id").primary();

    table
      .integer("id_modulo")
      .unsigned()
      .notNullable()
      .references("id_modulo")
      .inTable("modulo")
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
      .comment("Conteúdo do módulo para este campo");
    table
      .integer("ordem")
      .unsigned()
      .notNullable()
      .defaultTo(0)
      .comment("Ordem de exibição do conteúdo");

    // Cada campo só pode aparecer uma vez por módulo na mesma ordem
    table.unique(["id_modulo", "ordem"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("modulo_campo");
};
