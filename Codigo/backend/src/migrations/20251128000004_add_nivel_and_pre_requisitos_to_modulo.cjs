/**
 * Adiciona nivel ao modulo e tabela modulo_pre_requisito
 * nivel: nível que este módulo dá ao completar (para obrigatórios)
 * modulo_pre_requisito: quais módulos devem ser concluídos antes
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("modulo", (table) => {
    table.integer("nivel").unsigned().nullable();
  });

  await knex.schema.createTable("modulo_pre_requisito", (table) => {
    table.increments("id").primary();
    table.integer("id_modulo").unsigned().notNullable();
    table.integer("id_modulo_requerido").unsigned().notNullable();
    table.foreign("id_modulo").references("modulo.id_modulo").onDelete("CASCADE");
    table.foreign("id_modulo_requerido").references("modulo.id_modulo").onDelete("CASCADE");
    table.unique(["id_modulo", "id_modulo_requerido"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("modulo_pre_requisito");
  await knex.schema.alterTable("modulo", (table) => {
    table.dropColumn("nivel");
  });
};
