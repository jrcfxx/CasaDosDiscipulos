/**
 * Migration para criar tabela de campos de lição
 * Relaciona lições com campos personalizados (texto, número, data, link, upload)
 * Define o conteúdo da lição de forma estruturada
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("licao_campo", (table) => {
    table.increments("id").primary();

    table
      .integer("id_licao")
      .unsigned()
      .notNullable()
      .references("id_licao")
      .inTable("licao")
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
      .comment("Conteúdo da lição para este campo");
    table
      .integer("ordem")
      .unsigned()
      .notNullable()
      .defaultTo(0)
      .comment("Ordem de exibição do conteúdo");

    // Cada campo só pode aparecer uma vez por lição na mesma ordem
    table.unique(["id_licao", "ordem"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("licao_campo");
};
