/**
 * Migration: Permissões de líder (célula vs ministério)
 * lider_celula: acesso à Secretaria das Células (Lições, Formulários)
 * lider_ministerio: acesso à seção Escala (Na Casa)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("usuario", (table) => {
    table
      .boolean("lider_celula")
      .defaultTo(true)
      .comment("Se true e tipo=lider: acesso à Secretaria das Células");
    table
      .boolean("lider_ministerio")
      .defaultTo(false)
      .comment("Se true e tipo=lider: acesso à seção Escala");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("usuario", (table) => {
    table.dropColumn("lider_celula");
    table.dropColumn("lider_ministerio");
  });
};
