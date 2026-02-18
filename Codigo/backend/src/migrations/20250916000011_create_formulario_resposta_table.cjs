/**
 * Migration para criar tabela de respostas de formulário
 * Armazena as submissões de formulários pelos líderes
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("formulario_resposta", (table) => {
    table.increments("id_resposta").primary();

    table
      .integer("id_formulario")
      .unsigned()
      .notNullable()
      .references("id_formulario")
      .inTable("formulario")
      .onDelete("CASCADE");

    table
      .integer("id_usuario")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("CASCADE")
      .comment("Líder que respondeu");

    table
      .integer("id_celula")
      .unsigned()
      .notNullable()
      .references("id_celula")
      .inTable("celula")
      .onDelete("CASCADE")
      .comment("Célula relacionada à resposta");

    table.timestamp("data_resposta").defaultTo(knex.fn.now());

    // Um líder só pode responder um formulário uma vez por célula
    table.unique(["id_formulario", "id_celula", "data_resposta"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("formulario_resposta");
};
