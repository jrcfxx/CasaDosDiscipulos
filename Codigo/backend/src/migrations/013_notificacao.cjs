/**
 * Tabela notificacao - notificações in-app e WhatsApp
 * @param { import("knex").Knex } knex
 */
exports.up = (knex) =>
  knex.schema.createTable("notificacao", (table) => {
    table.increments("id_notificacao").primary();
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.string("tipo", 30).notNullable();
    table.integer("id_escala_evento").unsigned().nullable().references("escala_evento.id_escala_evento").onDelete("CASCADE");
    table.string("titulo", 255).notNullable();
    table.text("mensagem").nullable();
    table.string("area_nome", 100).nullable();
    table.boolean("lido").defaultTo(false);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists("notificacao");
