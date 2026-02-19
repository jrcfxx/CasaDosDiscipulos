import knex from "../database/index.js";

/**
 * Model para atribuições (usuários escalados em áreas)
 */
const EscalaAtribuicaoModel = {
  async getByAreaId(idArea) {
    return await knex("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .select("a.*", "u.nome as usuario_nome")
      .where("a.id_escala_area", idArea);
  },

  async getByEventoId(idEvento) {
    const areas = await knex("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", idEvento);

    const areaIds = areas.map((a) => a.id_escala_area);
    if (areaIds.length === 0) return [];

    return await knex("escala_atribuicao as a")
      .join("usuario as u", "a.id_usuario", "u.id_usuario")
      .join("escala_area as ar", "a.id_escala_area", "ar.id_escala_area")
      .select(
        "a.id_escala_atribuicao",
        "a.id_escala_area",
        "a.id_usuario",
        "u.nome as usuario_nome",
        "ar.nome as area_nome"
      )
      .whereIn("a.id_escala_area", areaIds);
  },

  async usuarioJaNoEvento(idEvento, idUsuario) {
    const areas = await knex("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", idEvento);

    const areaIds = areas.map((a) => a.id_escala_area);
    if (areaIds.length === 0) return null;

    const atrib = await knex("escala_atribuicao")
      .join("escala_area", "escala_atribuicao.id_escala_area", "escala_area.id_escala_area")
      .select("escala_area.nome as area_nome")
      .whereIn("escala_atribuicao.id_escala_area", areaIds)
      .where("escala_atribuicao.id_usuario", idUsuario)
      .first();

    return atrib;
  },

  async create(atribuicao) {
    const [insertId] = await knex("escala_atribuicao").insert(atribuicao);
    return await knex("escala_atribuicao")
      .join("usuario", "escala_atribuicao.id_usuario", "usuario.id_usuario")
      .select(
        "escala_atribuicao.*",
        "usuario.nome as usuario_nome"
      )
      .where("escala_atribuicao.id_escala_atribuicao", insertId)
      .first();
  },

  async delete(id) {
    return await knex("escala_atribuicao").where("id_escala_atribuicao", id).del();
  },

  async deleteByEventoId(idEvento) {
    const areas = await knex("escala_area")
      .select("id_escala_area")
      .where("id_escala_evento", idEvento);
    const areaIds = areas.map((a) => a.id_escala_area);
    if (areaIds.length === 0) return 0;
    return await knex("escala_atribuicao").whereIn("id_escala_area", areaIds).del();
  },
};

export default EscalaAtribuicaoModel;
