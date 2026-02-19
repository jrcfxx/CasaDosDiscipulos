/**
 * Tabelas evento (home) e licao
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("evento", (table) => {
    table.increments("id_evento").primary();
    table.string("titulo", 255).nullable();
    table.text("descricao").nullable();
    table.string("imagem_url", 500).notNullable();
    table.integer("ordem").defaultTo(0);
    table.boolean("ativo").defaultTo(true);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("licao", (table) => {
    table.increments("id_licao").primary();
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("licao");
  await knex.schema.dropTableIfExists("evento");
};
