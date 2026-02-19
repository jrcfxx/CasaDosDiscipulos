/**
 * Tabelas formulario, formulario_campo, formulario_resposta, formulario_resposta_campo
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("formulario", (table) => {
    table.increments("id_formulario").primary();
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
    table.string("frequencia", 20).nullable();
  });

  await knex.schema.createTable("formulario_campo", (table) => {
    table.increments("id").primary();
    table.integer("id_formulario").unsigned().notNullable().references("formulario.id_formulario").onDelete("CASCADE");
    table.integer("id_campo").unsigned().notNullable().references("campo_personalizado.id_campo").onDelete("CASCADE");
    table.string("label", 255).notNullable();
    table.text("conteudo").nullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(0);
    table.boolean("obrigatorio").defaultTo(false);
    table.unique(["id_formulario", "ordem"]);
  });

  await knex.schema.createTable("formulario_resposta", (table) => {
    table.increments("id_resposta").primary();
    table.integer("id_formulario").unsigned().notNullable().references("formulario.id_formulario").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.integer("id_celula").unsigned().notNullable().references("celula.id_celula").onDelete("CASCADE");
    table.timestamp("data_resposta").defaultTo(knex.fn.now());
    table.unique(["id_formulario", "id_celula", "data_resposta"]);
  });

  await knex.schema.createTable("formulario_resposta_campo", (table) => {
    table.increments("id_resposta_campo").primary();
    table.integer("id_resposta").unsigned().notNullable().references("formulario_resposta.id_resposta").onDelete("CASCADE");
    table.integer("id_formulario_campo").unsigned().notNullable().references("formulario_campo.id").onDelete("CASCADE");
    table.text("valor").nullable();
    table.unique(["id_resposta", "id_formulario_campo"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("formulario_resposta_campo");
  await knex.schema.dropTableIfExists("formulario_resposta");
  await knex.schema.dropTableIfExists("formulario_campo");
  await knex.schema.dropTableIfExists("formulario");
};
