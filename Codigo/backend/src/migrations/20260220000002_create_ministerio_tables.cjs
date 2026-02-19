/**
 * Migration: Ministérios - CRUD e vínculos com usuários e escala
 * ministerio: cadastro de ministérios
 * ministerio_lider: usuários que são líderes de cada ministério (N:N)
 * usuario_ministerio: usuários que participam de cada ministério (N:N)
 * escala_evento_ministerio: ministérios presentes em cada evento de escala
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("ministerio", (table) => {
      table.increments("id_ministerio").primary();
      table.string("nome", 150).notNullable();
      table.text("descricao");
      table.boolean("ativo").defaultTo(true);
      table.integer("ordem").defaultTo(0);
      table.timestamp("data_criacao").defaultTo(knex.fn.now());
      table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
    })
    .then(() =>
      knex.schema.createTable("ministerio_lider", (table) => {
        table.increments("id_ministerio_lider").primary();
        table
          .integer("id_ministerio")
          .unsigned()
          .notNullable()
          .references("id_ministerio")
          .inTable("ministerio")
          .onDelete("CASCADE");
        table
          .integer("id_usuario")
          .unsigned()
          .notNullable()
          .references("id_usuario")
          .inTable("usuario")
          .onDelete("CASCADE");
        table.unique(["id_ministerio", "id_usuario"]);
      })
    )
    .then(() =>
      knex.schema.createTable("usuario_ministerio", (table) => {
        table.increments("id_usuario_ministerio").primary();
        table
          .integer("id_ministerio")
          .unsigned()
          .notNullable()
          .references("id_ministerio")
          .inTable("ministerio")
          .onDelete("CASCADE");
        table
          .integer("id_usuario")
          .unsigned()
          .notNullable()
          .references("id_usuario")
          .inTable("usuario")
          .onDelete("CASCADE");
        table.unique(["id_ministerio", "id_usuario"]);
      })
    )
    .then(() =>
      knex.schema.createTable("escala_evento_ministerio", (table) => {
        table.increments("id_escala_evento_ministerio").primary();
        table
          .integer("id_escala_evento")
          .unsigned()
          .notNullable()
          .references("id_escala_evento")
          .inTable("escala_evento")
          .onDelete("CASCADE");
        table
          .integer("id_ministerio")
          .unsigned()
          .notNullable()
          .references("id_ministerio")
          .inTable("ministerio")
          .onDelete("CASCADE");
        table.unique(["id_escala_evento", "id_ministerio"]);
      })
    );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("escala_evento_ministerio")
    .then(() => knex.schema.dropTableIfExists("usuario_ministerio"))
    .then(() => knex.schema.dropTableIfExists("ministerio_lider"))
    .then(() => knex.schema.dropTableIfExists("ministerio"));
};
