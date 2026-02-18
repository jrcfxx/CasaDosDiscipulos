/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("usuario", (table) => {
    table
      .integer("id_nivel")
      .unsigned()
      .nullable()
      .references("id_nivel")
      .inTable("nivel")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("usuario", (table) => {
    table.dropForeign("id_nivel");
    table.dropColumn("id_nivel");
  });
};
