/**
 * Campo removido de um formulário que já tem respostas não pode ser apagado (as respostas antigas
 * apontam para ele). Antes ele ia para o fim (ordem 9999) e continuava aparecendo para quem
 * preenche; o segundo campo removido ainda batia no índice único (id_formulario, ordem).
 * Agora fica "arquivado": some do formulário, mas as respostas antigas continuam com o valor.
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable("formulario_campo", (table) => {
    table.boolean("arquivado").notNullable().defaultTo(false).comment("Removido do formulário, mantido pelas respostas antigas");
  });
  // Os que já estavam "empurrados para o fim" eram campos removidos
  await knex("formulario_campo").where("ordem", ">=", 9999).update({ arquivado: true });
};

/** @param { import("knex").Knex } knex */
exports.down = async (knex) => {
  await knex.schema.alterTable("formulario_campo", (table) => {
    table.dropColumn("arquivado");
  });
};
