/**
 * Migration para criar tabela usuario_celula
 * Vincula membros às células (célula principal opcional)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("usuario_celula", (table) => {
    table.increments("id_usuario_celula").primary();

    table
      .integer("id_usuario")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("CASCADE");

    table
      .integer("id_celula")
      .unsigned()
      .notNullable()
      .references("id_celula")
      .inTable("celula")
      .onDelete("CASCADE");

    table
      .boolean("principal")
      .defaultTo(false)
      .notNullable()
      .comment("Se true, é a célula principal do membro");

    table.unique(["id_usuario", "id_celula"]);

    table.index(["id_usuario"]);
    table.index(["id_celula"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("usuario_celula");
};
