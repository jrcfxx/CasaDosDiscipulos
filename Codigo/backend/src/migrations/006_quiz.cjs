/**
 * Tabelas quiz, quiz_campo, quiz_questao, quiz_resposta
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("quiz", (table) => {
    table.increments("id_quiz").primary();
    table.integer("id_modulo").unsigned().nullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
    table.timestamp("criado_em").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("quiz_campo", (table) => {
    table.increments("id").primary();
    table.integer("id_quiz").unsigned().notNullable().references("quiz.id_quiz").onDelete("CASCADE");
    table.integer("id_campo").unsigned().notNullable().references("campo_personalizado.id_campo").onDelete("CASCADE");
    table.text("label").notNullable();
    table.text("conteudo").notNullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(0);
    table.unique(["id_quiz", "ordem"]);
  });

  await knex.schema.createTable("quiz_questao", (table) => {
    table.increments("id_questao").primary();
    table.integer("id_quiz").unsigned().notNullable().references("quiz.id_quiz").onDelete("CASCADE");
    table.enum("tipo_questao", ["multipla_escolha", "verdadeiro_falso", "discursiva"]).notNullable();
    table.text("enunciado").notNullable();
    table.integer("pontos").unsigned().defaultTo(5);
    table.integer("ordem").unsigned().defaultTo(0);
    table.boolean("obrigatoria").defaultTo(true);
    table.text("opcoes").nullable();
    table.text("resposta_correta").nullable();
    table.timestamp("criado_em").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("quiz_resposta", (table) => {
    table.increments("id_resposta").primary();
    table.integer("id_questao").unsigned().notNullable().references("quiz_questao.id_questao").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.text("resposta").notNullable();
    table.boolean("correta").nullable();
    table.integer("pontos_obtidos").unsigned().defaultTo(0);
    table.timestamp("respondido_em").defaultTo(knex.fn.now());
    table.unique(["id_questao", "id_usuario"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("quiz_resposta");
  await knex.schema.dropTableIfExists("quiz_questao");
  await knex.schema.dropTableIfExists("quiz_campo");
  await knex.schema.dropTableIfExists("quiz");
};
