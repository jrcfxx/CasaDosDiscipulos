/**
 * Migration para criar tabela de campos de formulário
 * Relaciona formulários com campos personalizados (texto, número, data, link, upload)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("formulario_campo", (table) => {
    table.increments("id").primary();

    table
      .integer("id_formulario")
      .unsigned()
      .notNullable()
      .references("id_formulario")
      .inTable("formulario")
      .onDelete("CASCADE");

    table
      .integer("id_campo")
      .unsigned()
      .notNullable()
      .references("id_campo")
      .inTable("campo_personalizado")
      .onDelete("CASCADE")
      .comment("Tipo de campo: texto, numero, data, link, upload");

    table.string("label").notNullable().comment("Rótulo/pergunta do campo");
    table
      .text("conteudo")
      .nullable()
      .comment("Instruções ou descrição adicional");
    table
      .integer("ordem")
      .unsigned()
      .notNullable()
      .defaultTo(0)
      .comment("Ordem de exibição do campo");
    table
      .boolean("obrigatorio")
      .defaultTo(false)
      .comment("Se o campo é obrigatório");

    // Cada campo só pode aparecer uma vez por formulário na mesma ordem
    table.unique(["id_formulario", "ordem"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("formulario_campo");
};
