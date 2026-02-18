/**
 * Migration para criar tabela de células
 * Armazena informações sobre células da igreja
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("celula", (table) => {
    table.increments("id_celula").primary();
    table.string("nome", 255).notNullable();
    table.string("endereco", 500).nullable();
    table.string("dia_reuniao", 50).nullable();
    table.time("horario_reuniao").nullable();

    table
      .integer("id_lider")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("RESTRICT")
      .comment("Líder responsável pela célula");

    table.boolean("ativa").defaultTo(true);
    table.timestamp("criada_em").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("celula");
};
