/**
 * Remove formulario_celula_frequencia e adiciona frequencia no formulário
 * Frequência define com que periodicidade o formulário deve ser enviado (aplica a todas as células)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .dropTableIfExists("formulario_celula_frequencia")
    .then(() =>
      knex.schema.alterTable("formulario", (table) => {
        table
          .string("frequencia", 20)
          .nullable();
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("formulario", (table) => {
    table.dropColumn("frequencia");
  });
};
