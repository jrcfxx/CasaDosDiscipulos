/**
 * Migration: Escala - eventos de calendário e atribuições
 * escala_evento: eventos criados pelo admin (data, título)
 * escala_area: áreas/funções por evento (ex: Som, Louvor, Receção)
 * escala_atribuicao: usuários escalados em cada área (1 pessoa = 1 área por evento)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("escala_evento", (table) => {
      table.increments("id_escala_evento").primary();
      table.string("titulo", 255).notNullable();
      table.dateTime("data_hora").notNullable();
      table.text("descricao");
      table.boolean("ativo").defaultTo(true);
      table.integer("id_criador").unsigned().references("id_usuario").inTable("usuario");
      table.timestamp("data_criacao").defaultTo(knex.fn.now());
      table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
    })
    .then(() =>
      knex.schema.createTable("escala_area", (table) => {
        table.increments("id_escala_area").primary();
        table
          .integer("id_escala_evento")
          .unsigned()
          .notNullable()
          .references("id_escala_evento")
          .inTable("escala_evento")
          .onDelete("CASCADE");
        table.string("nome", 100).notNullable();
        table.integer("ordem").defaultTo(0);
      })
    )
    .then(() =>
      knex.schema.createTable("escala_atribuicao", (table) => {
        table.increments("id_escala_atribuicao").primary();
        table
          .integer("id_escala_area")
          .unsigned()
          .notNullable()
          .references("id_escala_area")
          .inTable("escala_area")
          .onDelete("CASCADE");
        table
          .integer("id_usuario")
          .unsigned()
          .notNullable()
          .references("id_usuario")
          .inTable("usuario")
          .onDelete("CASCADE");
        table.unique(["id_escala_area", "id_usuario"]);
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("escala_atribuicao")
    .then(() => knex.schema.dropTableIfExists("escala_area"))
    .then(() => knex.schema.dropTableIfExists("escala_evento"));
};
