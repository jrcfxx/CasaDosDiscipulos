/**
 * Migration para adicionar campo de modalidades aos campos personalizados
 * Define quais campos podem ser usados em cada contexto (modulo, quiz, licao, formulario)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("campo_personalizado", (table) => {
    // JSON com array de modalidades permitidas para cada campo
    // Exemplo: ["modulo", "quiz", "licao", "formulario"]
    table.json("modalidades").notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("campo_personalizado", (table) => {
    table.dropColumn("modalidades");
  });
};
