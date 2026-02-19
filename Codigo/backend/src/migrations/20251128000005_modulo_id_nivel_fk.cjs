/**
 * Substitui modulo.nivel (int) por modulo.id_nivel (FK nivel)
 * Vincula módulo à entidade nivel existente (CRUD admin)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("modulo", (table) => {
    table.dropColumn("nivel");
  });
  await knex.schema.alterTable("modulo", (table) => {
    table
      .integer("id_nivel")
      .unsigned()
      .nullable()
      .references("id_nivel")
      .inTable("nivel")
      .onDelete("SET NULL");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("modulo", (table) => {
    table.dropForeign(["id_nivel"]);
    table.dropColumn("id_nivel");
  });
  await knex.schema.alterTable("modulo", (table) => {
    table.integer("nivel").unsigned().nullable();
  });
};
