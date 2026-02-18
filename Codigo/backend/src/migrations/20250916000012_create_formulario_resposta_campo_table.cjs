/**
 * Migration para criar tabela de respostas de campos de formulário
 * Armazena os valores respondidos para cada campo do formulário
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("formulario_resposta_campo", (table) => {
    table.increments("id_resposta_campo").primary();

    table
      .integer("id_resposta")
      .unsigned()
      .notNullable()
      .references("id_resposta")
      .inTable("formulario_resposta")
      .onDelete("CASCADE");

    table
      .integer("id_formulario_campo")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("formulario_campo")
      .onDelete("CASCADE")
      .comment("Referência ao campo específico do formulário");

    table
      .text("valor")
      .nullable()
      .comment("Valor da resposta em formato JSON se necessário");

    // Cada campo só pode ser respondido uma vez por resposta
    table.unique(["id_resposta", "id_formulario_campo"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("formulario_resposta_campo");
};
