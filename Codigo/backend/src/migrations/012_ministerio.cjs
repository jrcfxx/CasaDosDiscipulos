/**
 * Tabelas ministerio, ministerio_lider, usuario_ministerio, escala_evento_ministerio
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("ministerio", (table) => {
    table.increments("id_ministerio").primary();
    table.string("nome", 150).notNullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
    table.integer("ordem").defaultTo(0);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("ministerio_lider", (table) => {
    table.increments("id_ministerio_lider").primary();
    table.integer("id_ministerio").unsigned().notNullable().references("ministerio.id_ministerio").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.unique(["id_ministerio", "id_usuario"]);
  });

  await knex.schema.createTable("usuario_ministerio", (table) => {
    table.increments("id_usuario_ministerio").primary();
    table.integer("id_ministerio").unsigned().notNullable().references("ministerio.id_ministerio").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.unique(["id_ministerio", "id_usuario"]);
  });

  await knex.schema.createTable("escala_evento_ministerio", (table) => {
    table.increments("id_escala_evento_ministerio").primary();
    table.integer("id_escala_evento").unsigned().notNullable().references("escala_evento.id_escala_evento").onDelete("CASCADE");
    table.integer("id_ministerio").unsigned().notNullable().references("ministerio.id_ministerio").onDelete("CASCADE");
    table.unique(["id_escala_evento", "id_ministerio"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("escala_evento_ministerio");
  await knex.schema.dropTableIfExists("usuario_ministerio");
  await knex.schema.dropTableIfExists("ministerio_lider");
  await knex.schema.dropTableIfExists("ministerio");
};
