/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("usuario", (table) => {
    table.increments("id_usuario").primary();
    table.string("nome", 255).notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("senha", 255).notNullable();
    table
      .enum("tipo", ["administrador", "lider", "membro"])
      .defaultTo("membro")
      .notNullable();
    table.integer("pontuacao").defaultTo(0);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.boolean("ativo").defaultTo(true);
    table.timestamp("ultimo_login").nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("usuario");
};
