/**
 * Permite a mesma pessoa em mais de uma função do mesmo ministério num evento
 * (ex.: guitarra e vocal no Louvor), como exceção confirmada pelo líder.
 *
 * Até aqui o banco aceitava só uma linha por pessoa em cada área do evento. Agora a regra fica
 * na aplicação: funções diferentes = exceção confirmável; a MESMA função duas vezes = bloqueado.
 *
 * O índice único também servia à chave estrangeira de id_escala_area, então primeiro criamos um
 * índice comum para ela e só depois removemos o único.
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.alterTable("escala_atribuicao", (table) => {
    table.index(["id_escala_area", "id_usuario"], "escala_atribuicao_area_usuario_idx");
  });
  await knex.schema.alterTable("escala_atribuicao", (table) => {
    table.dropUnique(["id_escala_area", "id_usuario"]);
  });
};

/**
 * Volta a exigir uma linha por pessoa em cada área. Se alguém estiver em duas funções da mesma
 * área, mantém só a primeira atribuição (a mais antiga) para o índice único poder voltar.
 * @param { import("knex").Knex } knex
 */
exports.down = async (knex) => {
  const repetidas = await knex("escala_atribuicao")
    .select("id_escala_area", "id_usuario")
    .min({ manter: "id_escala_atribuicao" })
    .groupBy("id_escala_area", "id_usuario")
    .havingRaw("COUNT(*) > 1");
  for (const r of repetidas) {
    await knex("escala_atribuicao")
      .where({ id_escala_area: r.id_escala_area, id_usuario: r.id_usuario })
      .whereNot("id_escala_atribuicao", r.manter)
      .del();
  }
  await knex.schema.alterTable("escala_atribuicao", (table) => {
    table.unique(["id_escala_area", "id_usuario"]);
  });
  await knex.schema.alterTable("escala_atribuicao", (table) => {
    table.dropIndex(["id_escala_area", "id_usuario"], "escala_atribuicao_area_usuario_idx");
  });
};
