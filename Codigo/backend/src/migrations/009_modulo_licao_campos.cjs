/**
 * Tabelas modulo_campo e licao_campo
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("modulo_campo", (table) => {
    table.increments("id").primary();
    table.integer("id_modulo").unsigned().notNullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.integer("id_campo").unsigned().notNullable().references("campo_personalizado.id_campo").onDelete("CASCADE");
    table.string("label", 255).notNullable();
    table.text("conteudo").notNullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(0);
    table.unique(["id_modulo", "ordem"]);
  });

  await knex.schema.createTable("licao_campo", (table) => {
    table.increments("id").primary();
    table.integer("id_licao").unsigned().notNullable().references("licao.id_licao").onDelete("CASCADE");
    table.integer("id_campo").unsigned().notNullable().references("campo_personalizado.id_campo").onDelete("CASCADE");
    table.string("label", 255).notNullable();
    table.text("conteudo").notNullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(0);
    table.unique(["id_licao", "ordem"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("licao_campo");
  await knex.schema.dropTableIfExists("modulo_campo");
};
