/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("evento", (table) => {
    table.increments("id_evento").primary();
    table.string("titulo", 255);
    table.text("descricao");
    table.string("imagem_url", 500).notNullable();
    table.integer("ordem").defaultTo(0);
    table.boolean("ativo").defaultTo(true);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("evento");
};
