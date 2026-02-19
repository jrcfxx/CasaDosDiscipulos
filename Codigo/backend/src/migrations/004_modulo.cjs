/**
 * Tabelas modulo e modulo_pre_requisito
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("modulo", (table) => {
    table.increments("id_modulo").primary();
    table.string("titulo", 255).notNullable();
    table.text("descricao").nullable();
    table.integer("ordem").unsigned().notNullable().defaultTo(1);
    table.boolean("ativo").defaultTo(true);
    table.boolean("obrigatorio").defaultTo(true);
    table
      .integer("id_nivel")
      .unsigned()
      .nullable()
      .references("id_nivel")
      .inTable("nivel")
      .onDelete("SET NULL");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("modulo_pre_requisito", (table) => {
    table.increments("id").primary();
    table.integer("id_modulo").unsigned().notNullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.integer("id_modulo_requerido").unsigned().notNullable().references("modulo.id_modulo").onDelete("CASCADE");
    table.unique(["id_modulo", "id_modulo_requerido"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("modulo_pre_requisito");
  await knex.schema.dropTableIfExists("modulo");
};
