/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("usuario_modulo", (table) => {
    table.increments("id_usuario_modulo").primary();
    table.integer("id_usuario").unsigned().notNullable();
    table.integer("id_modulo").unsigned().notNullable();
    table
      .enum("status", ["nao_iniciado", "em_andamento", "concluido"])
      .defaultTo("nao_iniciado");
    table.decimal("nota_quiz", 5, 2).nullable();
    table.timestamp("data_inicio").defaultTo(knex.fn.now());
    table.timestamp("data_conclusao").nullable();

    table.foreign("id_usuario").references("id_usuario").inTable("usuario");
    table.foreign("id_modulo").references("id_modulo").inTable("modulo");
    table.unique(["id_usuario", "id_modulo"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("usuario_modulo");
};
