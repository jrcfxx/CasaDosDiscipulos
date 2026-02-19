/**
 * Tabela nivel - níveis da Escola de Discípulos
 * @param { import("knex").Knex } knex
 */
exports.up = (knex) =>
  knex.schema.createTable("nivel", (table) => {
    table.increments("id_nivel").primary();
    table.string("nome", 100).notNullable().unique();
    table.text("descricao").nullable();
    table.integer("ordem").notNullable().defaultTo(0);
    table.boolean("ativo").defaultTo(true);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists("nivel");
