/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("modulo", (table) => {
    table.increments("id_modulo").primary();
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(1);
    table.boolean("ativo").defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("modulo");
};
