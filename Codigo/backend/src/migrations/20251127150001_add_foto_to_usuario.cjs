/**
 * Migration: Adicionar coluna foto à tabela usuario
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("usuario", function (table) {
    table.string("foto", 500).nullable().comment("Caminho da foto de perfil");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("usuario", function (table) {
    table.dropColumn("foto");
  });
};
