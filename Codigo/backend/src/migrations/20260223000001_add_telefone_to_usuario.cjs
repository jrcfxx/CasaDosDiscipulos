/**
 * Adiciona coluna telefone na tabela usuario para notificações WhatsApp
 * Formato: E.164 (ex: 5511999999999)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("usuario", (table) => {
    table.string("telefone", 20).nullable().comment("Telefone para WhatsApp (E.164)");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("usuario", (table) => {
    table.dropColumn("telefone");
  });
};
