/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("licao", (table) => {
    table.increments("id_licao").primary();
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.down = function (knex) {
  return knex.schema.dropTable("licao");
};
