/**
 * Migration para criar tabela de respostas de quiz
 * Armazena as respostas dos usuários para cada questão
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("quiz_resposta", (table) => {
    table.increments("id_resposta").primary();

    table
      .integer("id_questao")
      .unsigned()
      .notNullable()
      .references("id_questao")
      .inTable("quiz_questao")
      .onDelete("CASCADE");

    table
      .integer("id_usuario")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("CASCADE");

    table.text("resposta").notNullable();
    table.boolean("correta").nullable().comment("NULL para discursivas");
    table.integer("pontos_obtidos").unsigned().defaultTo(0);
    table.timestamp("respondido_em").defaultTo(knex.fn.now());

    // Um usuário só pode responder uma vez cada questão
    table.unique(["id_questao", "id_usuario"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("quiz_resposta");
};
