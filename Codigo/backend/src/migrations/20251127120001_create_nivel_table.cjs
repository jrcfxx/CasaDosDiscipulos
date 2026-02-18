/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("nivel", (table) => {
    table.increments("id_nivel").primary();
    table.string("nome", 100).notNullable().unique();
    table.text("descricao").nullable();
    table.integer("ordem").notNullable().defaultTo(0); // Para ordenar os níveis
    table.boolean("ativo").defaultTo(true);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("nivel");
};
