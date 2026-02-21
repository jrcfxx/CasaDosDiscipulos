/**
 * Tabelas escala: escala_evento, escala_area, escala_atribuicao
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("escala_evento", (table) => {
    table.increments("id_escala_evento").primary();
    table.string("titulo", 255).notNullable();
    table.dateTime("data_hora").notNullable();
    table.dateTime("data_hora_fim").nullable();
    table.text("descricao").nullable();
    table.boolean("ativo").defaultTo(true);
    table.integer("id_criador").unsigned().references("usuario.id_usuario").onDelete("SET NULL");
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("escala_area", (table) => {
    table.increments("id_escala_area").primary();
    table.integer("id_escala_evento").unsigned().notNullable().references("escala_evento.id_escala_evento").onDelete("CASCADE");
    table.string("nome", 100).notNullable();
    table.integer("ordem").defaultTo(0);
  });

  await knex.schema.createTable("escala_atribuicao", (table) => {
    table.increments("id_escala_atribuicao").primary();
    table.integer("id_escala_area").unsigned().notNullable().references("escala_area.id_escala_area").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.text("detalhes").nullable().comment("JSON: campos específicos do ministério");
    table.unique(["id_escala_area", "id_usuario"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("escala_atribuicao");
  await knex.schema.dropTableIfExists("escala_area");
  await knex.schema.dropTableIfExists("escala_evento");
};
