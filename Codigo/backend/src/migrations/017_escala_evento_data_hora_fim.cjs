/**
 * Adiciona data_hora_fim à escala_evento para permitir verificação correta
 * de sobreposição de horários (uma pessoa não pode estar em 2 eventos que coincidem).
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable("escala_evento", (table) => {
    table.dateTime("data_hora_fim").nullable().after("data_hora");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("escala_evento", (table) => {
    table.dropColumn("data_hora_fim");
  });
};
