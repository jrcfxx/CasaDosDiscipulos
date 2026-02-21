/**
 * Adiciona coluna auto_completo_por_nivel em usuario_modulo
 * para rastrear módulos marcados como concluídos automaticamente por nível,
 * permitindo reverter pontos ao rebaixar o usuário.
 */
exports.up = async (knex) => {
  await knex.schema.alterTable("usuario_modulo", (table) => {
    table.boolean("auto_completo_por_nivel").defaultTo(false);
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("usuario_modulo", (table) => {
    table.dropColumn("auto_completo_por_nivel");
  });
};
