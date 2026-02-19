/**
 * Migration: Notificações para usuários
 * - evento_criado: novo evento na escala (notifica membros dos ministérios do evento)
 * - escalado: usuário foi escalado para um evento
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("notificacao", (table) => {
    table.increments("id_notificacao").primary();
    table
      .integer("id_usuario")
      .unsigned()
      .notNullable()
      .references("id_usuario")
      .inTable("usuario")
      .onDelete("CASCADE");
    table
      .string("tipo", 30)
      .notNullable()
      .comment("evento_criado | escalado");
    table
      .integer("id_escala_evento")
      .unsigned()
      .references("id_escala_evento")
      .inTable("escala_evento")
      .onDelete("CASCADE");
    table.string("titulo", 255).notNullable();
    table.text("mensagem");
    table.string("area_nome", 100).comment("Para tipo escalado: nome da área");
    table.boolean("lido").defaultTo(false);
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("notificacao");
};
