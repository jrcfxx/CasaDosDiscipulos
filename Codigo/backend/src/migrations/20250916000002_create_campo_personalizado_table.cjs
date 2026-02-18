/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("campo_personalizado", (table) => {
    table.increments("id_campo").primary();
    table
      .enum("tipo_campo", [
        // Campos gerais para módulos, lições e formulários
        "texto",
        "numero",
        "data",
        "link",
        "upload",
        // Campos específicos para questões de quiz
        "multipla_escolha",
        "verdadeiro_falso",
        "discursiva",
      ])
      .notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("campo_personalizado");
};
