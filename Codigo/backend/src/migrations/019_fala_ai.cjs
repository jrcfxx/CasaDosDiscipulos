/**
 * Tabelas Fala Aí Discípulo - devocional e palavra do dia com comentários
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("fala_ai_post", (table) => {
    table.increments("id_post").primary();
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.enum("tipo", ["devocional", "palavra_do_dia"]).notNullable();
    table.string("titulo", 255).nullable();
    table.text("conteudo").notNullable();
    table.string("referencia", 100).nullable().comment("Ex: João 3:16");
    table.string("imagem_url", 500).nullable();
    table.date("data_publicacao").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("fala_ai_comentario", (table) => {
    table.increments("id_comentario").primary();
    table.integer("id_post").unsigned().notNullable().references("fala_ai_post.id_post").onDelete("CASCADE");
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.text("texto").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("fala_ai_comentario");
  await knex.schema.dropTableIfExists("fala_ai_post");
};
