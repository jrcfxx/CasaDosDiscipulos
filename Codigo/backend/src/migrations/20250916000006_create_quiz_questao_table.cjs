/**
 * Migration para criar tabela de questões de quiz
 * Separa as questões do quiz dos campos de conteúdo
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("quiz_questao", (table) => {
    table.increments("id_questao").primary();

    table
      .integer("id_quiz")
      .unsigned()
      .notNullable()
      .references("id_quiz")
      .inTable("quiz")
      .onDelete("CASCADE");

    table
      .enum("tipo_questao", [
        "multipla_escolha",
        "verdadeiro_falso",
        "discursiva",
      ])
      .notNullable();

    table.text("enunciado").notNullable();
    table.integer("pontos").unsigned().defaultTo(5);
    table.integer("ordem").unsigned().defaultTo(0);
    table.boolean("obrigatoria").defaultTo(true);

    // Para questões de múltipla escolha
    table.text("opcoes").nullable().comment("JSON com as opções");
    table.text("resposta_correta").nullable();

    table.timestamp("criado_em").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("quiz_questao");
};
