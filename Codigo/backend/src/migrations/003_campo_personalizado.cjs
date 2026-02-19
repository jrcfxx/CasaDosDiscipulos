/**
 * Tabela campo_personalizado - tipos de campo para módulos, quiz, lições, formulários
 * @param { import("knex").Knex } knex
 */
exports.up = (knex) =>
  knex.schema.createTable("campo_personalizado", (table) => {
    table.increments("id_campo").primary();
    table
      .enum("tipo_campo", [
        "texto",
        "numero",
        "data",
        "link",
        "upload",
        "video",
        "textarea",
        "quiz",
        "multipla_escolha",
        "verdadeiro_falso",
        "discursiva",
        "checkbox",
        "select",
      ])
      .notNullable();
    table.json("modalidades").nullable();
  });

exports.down = (knex) => knex.schema.dropTableIfExists("campo_personalizado");
