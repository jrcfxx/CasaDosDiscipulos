/**
 * Tabelas celula e celula_lider (múltiplos líderes por célula)
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("celula", (table) => {
    table.increments("id_celula").primary();
    table.string("nome", 255).notNullable();
    table.string("endereco", 500).nullable();
    table.string("dia_reuniao", 50).nullable();
    table.time("horario_reuniao").nullable();
    table.boolean("ativa").defaultTo(true);
    table.timestamp("criada_em").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("celula_lider", (table) => {
    table.increments("id_celula_lider").primary();
    table.integer("id_celula").unsigned().notNullable().references("celula.id_celula").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.boolean("principal").defaultTo(false).notNullable();
    table.unique(["id_celula", "id_usuario"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("celula_lider");
  await knex.schema.dropTableIfExists("celula");
};
